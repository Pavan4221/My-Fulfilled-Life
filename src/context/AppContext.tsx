import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  collection,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  User
} from '../firebase';
import {
  DayData,
  JournalEntry,
  UserProfile,
  ViewType,
  ExportData,
  IntentionItem,
  NotificationSettings
} from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  subscribeToWebPush
} from '../services/notificationService';

export const DEFAULTS = [
  'Take a mindful pause',
  'Move in a way that feels good',
  'Nourish myself with care',
  'Connect with someone I value',
  'Learn or explore something',
  'Make time for joy or creativity',
  'Rest and recharge'
];

export const LEGACY_DEFAULTS = [
  'Gratitude or quiet breathing',
  'Move my body (swim, strength or walk)',
  'Eat in a way that supports my health',
  'Learn or read something with curiosity',
  'Play piano for pleasure',
  'Be present with family',
  'Choose my phone time intentionally'
];

export function getTodayKey(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultIntentions(names: string[]): IntentionItem[] {
  return names.map((name, i) => ({
    id: `intent_${i}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}`,
    name,
    reminderEnabled: false,
    reminderTime: '09:00',
    reminderDays: ['daily'],
    reminderNote: `Time to gently ${name.toLowerCase()}.`
  }));
}

interface AppContextType {
  user: UserProfile | null;
  isLoadingAuth: boolean;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  habits: string[];
  intentionsList: IntentionItem[];
  dayData: DayData;
  journal: JournalEntry[];
  syncStatus: { text: string; isError?: boolean };
  dayStatus: string;
  todayKey: string;
  todayFormatted: string;
  notificationSettings: NotificationSettings;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOutUser: () => Promise<void>;
  toggleHabit: (index: number) => void;
  updateGratitude: (val: string) => void;
  updateReflection: (val: string) => void;
  saveHabits: (newList: string[]) => Promise<boolean>;
  updateIntentionItem: (id: string, updates: Partial<IntentionItem>) => Promise<boolean>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<boolean>;
  requestNotifications: () => Promise<NotificationPermission>;
  triggerTestNotification: () => Promise<{ success: boolean; message: string }>;
  addJournalEntry: (text: string) => Promise<boolean>;
  deleteJournalEntry: (id: string) => Promise<boolean>;
  exportData: () => Promise<void>;
  importData: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  allCompleted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'mfl_guest_storage_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayKey = getTodayKey();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [habits, setHabits] = useState<string[]>(DEFAULTS.slice());
  const [intentionsList, setIntentionsList] = useState<IntentionItem[]>(
    createDefaultIntentions(DEFAULTS)
  );
  const [dayData, setDayData] = useState<DayData>({
    date: todayKey,
    checks: [],
    gratitude: '',
    reflection: ''
  });
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ text: string; isError?: boolean }>({
    text: 'Connecting…'
  });
  const [dayStatus, setDayStatus] = useState<string>('Changes sync automatically.');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    permission: getNotificationPermission(),
    morningReminder: { enabled: false, time: '08:00' },
    eveningReminder: { enabled: false, time: '20:30' },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  const writeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubsRef = useRef<(() => void)[]>([]);
  const dayDataRef = useRef<DayData>(dayData);
  dayDataRef.current = dayData;
  const habitsRef = useRef<string[]>(habits);
  habitsRef.current = habits;
  const intentionsListRef = useRef<IntentionItem[]>(intentionsList);
  intentionsListRef.current = intentionsList;
  const notificationSettingsRef = useRef<NotificationSettings>(notificationSettings);
  notificationSettingsRef.current = notificationSettings;
  const userRef = useRef<UserProfile | null>(user);
  userRef.current = user;

  const firedRemindersRef = useRef<Set<string>>(new Set());

  const todayFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Clean Firestore subscriptions
  const cleanupSubscriptions = useCallback(() => {
    unsubsRef.current.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        // ignore
      }
    });
    unsubsRef.current = [];
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current);
      writeTimerRef.current = null;
    }
  }, []);

  // Save guest data helper
  const saveGuestStorage = useCallback(
    (
      newHabits: string[],
      newIntentions: IntentionItem[],
      newDayData: DayData,
      newJournal: JournalEntry[],
      newNotifications: NotificationSettings
    ) => {
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : { dailyCheckins: {} };
        parsed.habits = newHabits;
        parsed.intentionsList = newIntentions;
        if (!parsed.dailyCheckins) parsed.dailyCheckins = {};
        parsed.dailyCheckins[newDayData.date] = newDayData;
        parsed.journal = newJournal;
        parsed.notificationSettings = newNotifications;
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(parsed));
      } catch (e) {
        console.warn('Guest localStorage error:', e);
      }
    },
    []
  );

  // Load guest data
  const loadGuestStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.habits) && parsed.habits.length > 0) {
          setHabits(parsed.habits);
          if (Array.isArray(parsed.intentionsList) && parsed.intentionsList.length === parsed.habits.length) {
            setIntentionsList(parsed.intentionsList);
          } else {
            setIntentionsList(createDefaultIntentions(parsed.habits));
          }
        } else {
          setHabits(DEFAULTS.slice());
          setIntentionsList(createDefaultIntentions(DEFAULTS));
        }

        if (parsed.dailyCheckins && parsed.dailyCheckins[todayKey]) {
          setDayData(parsed.dailyCheckins[todayKey]);
        } else {
          setDayData({
            date: todayKey,
            checks: [],
            gratitude: '',
            reflection: ''
          });
        }
        if (Array.isArray(parsed.journal)) {
          setJournal(parsed.journal);
        }
        if (parsed.notificationSettings) {
          setNotificationSettings({
            ...parsed.notificationSettings,
            permission: getNotificationPermission()
          });
        }
      } else {
        setHabits(DEFAULTS.slice());
        setIntentionsList(createDefaultIntentions(DEFAULTS));
        setDayData({
          date: todayKey,
          checks: [],
          gratitude: '',
          reflection: ''
        });
        setJournal([]);
      }
      setSyncStatus({ text: 'Local private storage' });
    } catch (e) {
      console.warn('Error reading guest storage:', e);
    }
  }, [todayKey]);

  // Subscribe to Firestore for an authenticated user
  const subscribeFirestore = useCallback(
    (fbUser: User) => {
      cleanupSubscriptions();
      setSyncStatus({ text: 'Connecting to your account…' });

      const uid = fbUser.uid;
      const settingsRef = doc(db, 'users', uid, 'profile', 'preferences');
      const dailyRef = doc(db, 'users', uid, 'dailyCheckins', todayKey);
      const journalCol = collection(db, 'users', uid, 'journal');

      // 1. Settings subscription
      const unsubSettings = onSnapshot(
        settingsRef,
        (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.habits)) {
            const data = snap.data();
            const savedHabits = data.habits as string[];
            const isLegacy =
              savedHabits.length === LEGACY_DEFAULTS.length &&
              savedHabits.every((h, i) => h === LEGACY_DEFAULTS[i]);

            if (isLegacy && data.intentionsVersion !== 2) {
              setHabits(DEFAULTS.slice());
              const defaultItems = createDefaultIntentions(DEFAULTS);
              setIntentionsList(defaultItems);
              setDoc(
                settingsRef,
                {
                  habits: DEFAULTS,
                  intentionsList: defaultItems,
                  intentionsVersion: 2,
                  updatedAt: serverTimestamp()
                },
                { merge: true }
              ).catch(console.error);
              setDoc(
                dailyRef,
                { checks: [], updatedAt: serverTimestamp() },
                { merge: true }
              ).catch(console.error);
            } else {
              setHabits(savedHabits);
              if (Array.isArray(data.intentionsList) && data.intentionsList.length === savedHabits.length) {
                setIntentionsList(data.intentionsList);
              } else {
                setIntentionsList(createDefaultIntentions(savedHabits));
              }
              if (data.intentionsVersion !== 2) {
                setDoc(
                  settingsRef,
                  { intentionsVersion: 2 },
                  { merge: true }
                ).catch(console.error);
              }
            }

            if (data.notificationSettings) {
              setNotificationSettings({
                ...data.notificationSettings,
                permission: getNotificationPermission()
              });
            }
          } else {
            setHabits(DEFAULTS.slice());
            const defaultItems = createDefaultIntentions(DEFAULTS);
            setIntentionsList(defaultItems);
            setDoc(
              settingsRef,
              {
                habits: DEFAULTS,
                intentionsList: defaultItems,
                intentionsVersion: 2,
                createdAt: serverTimestamp()
              },
              { merge: true }
            ).catch(console.error);
          }
        },
        (err) => {
          setSyncStatus({ text: `Settings sync error: ${err.message}`, isError: true });
        }
      );

      // 2. Daily Check-in subscription
      const unsubDaily = onSnapshot(
        dailyRef,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setDayData({
              date: todayKey,
              checks: d.checks || [],
              gratitude: d.gratitude || '',
              reflection: d.reflection || '',
              updatedAt: d.updatedAt
            });
          } else {
            setDayData({
              date: todayKey,
              checks: [],
              gratitude: '',
              reflection: ''
            });
          }
          setSyncStatus({ text: 'Synced with your account' });
        },
        (err) => {
          setSyncStatus({ text: `Daily sync error: ${err.message}`, isError: true });
        }
      );

      // 3. Journal subscription
      const q = query(journalCol, orderBy('createdAt', 'desc'));
      const unsubJournal = onSnapshot(
        q,
        (snap) => {
          const list: JournalEntry[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              text: data.text || '',
              createdAt: data.createdAt,
              createdAtISO: data.createdAtISO || new Date().toISOString()
            };
          });
          setJournal(list);
        },
        (err) => {
          console.error('Journal snapshot error:', err);
        }
      );

      unsubsRef.current = [unsubSettings, unsubDaily, unsubJournal];
    },
    [cleanupSubscriptions, todayKey]
  );

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setIsLoadingAuth(false);
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          isGuest: false
        };
        setUser(profile);
        subscribeFirestore(fbUser);
      } else {
        const savedGuest = localStorage.getItem('mfl_guest_active');
        if (savedGuest === 'true') {
          const guestProfile: UserProfile = {
            uid: 'guest_user',
            email: null,
            displayName: 'Guest Friend',
            photoURL: null,
            isGuest: true
          };
          setUser(guestProfile);
          loadGuestStorage();
        } else {
          setUser(null);
          cleanupSubscriptions();
        }
      }
    });

    return () => {
      unsubAuth();
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions, loadGuestStorage, subscribeFirestore]);

  // Active in-app timer check for reminders while app is open
  useEffect(() => {
    if (!isNotificationSupported()) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;
      const minuteKey = `${todayKey}_${timeStr}`;

      const notifs = notificationSettingsRef.current;
      if (!notifs.enabled && getNotificationPermission() !== 'granted') return;

      // 1. Check Morning Checkin Reminder
      if (notifs.morningReminder?.enabled && notifs.morningReminder.time === timeStr) {
        const fireKey = `${minuteKey}_morning`;
        if (!firedRemindersRef.current.has(fireKey)) {
          firedRemindersRef.current.add(fireKey);
          sendTestNotification(
            'Morning Check-In 🌿',
            'Good morning! Set your gentle intentions for today.'
          );
        }
      }

      // 2. Check Evening Reflection Reminder
      if (notifs.eveningReminder?.enabled && notifs.eveningReminder.time === timeStr) {
        const fireKey = `${minuteKey}_evening`;
        if (!firedRemindersRef.current.has(fireKey)) {
          firedRemindersRef.current.add(fireKey);
          sendTestNotification(
            'Evening Reflection 🌙',
            'Take a moment of quiet gratitude before your evening begins.'
          );
        }
      }

      // 3. Check Individual Intentions
      intentionsListRef.current.forEach((intent) => {
        if (intent.reminderEnabled && intent.reminderTime === timeStr) {
          const fireKey = `${minuteKey}_${intent.id}`;
          if (!firedRemindersRef.current.has(fireKey)) {
            firedRemindersRef.current.add(fireKey);
            sendTestNotification(
              intent.name,
              intent.reminderNote || `A gentle reminder: ${intent.name}`
            );
          }
        }
      });
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [todayKey]);

  // Schedule debounced day save
  const scheduleDaySave = useCallback(
    (updatedDay: DayData) => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      setDayStatus('Saving…');

      writeTimerRef.current = setTimeout(async () => {
        const currentUser = userRef.current;
        if (!currentUser) return;

        if (currentUser.isGuest) {
          saveGuestStorage(
            habitsRef.current,
            intentionsListRef.current,
            updatedDay,
            journal,
            notificationSettingsRef.current
          );
          setDayStatus('Saved locally ✓');
          return;
        }

        try {
          const dailyRef = doc(db, 'users', currentUser.uid, 'dailyCheckins', todayKey);
          await setDoc(
            dailyRef,
            {
              date: todayKey,
              checks: updatedDay.checks,
              gratitude: updatedDay.gratitude,
              reflection: updatedDay.reflection,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
          setDayStatus('Synced ✓');
        } catch (e: any) {
          setDayStatus('Could not sync. Check connection.');
          console.error('Save daily error:', e);
        }
      }, 450);
    },
    [journal, saveGuestStorage, todayKey]
  );

  // Toggle habit checkbox
  const toggleHabit = useCallback(
    (index: number) => {
      const currentChecks = dayDataRef.current.checks;
      const isAlreadyChecked = currentChecks.includes(index);
      const nextChecks = isAlreadyChecked
        ? currentChecks.filter((x) => x !== index)
        : [...new Set([...currentChecks, index])];

      const nextDay: DayData = {
        ...dayDataRef.current,
        checks: nextChecks
      };

      setDayData(nextDay);
      scheduleDaySave(nextDay);

      if (!isAlreadyChecked && nextChecks.length === habitsRef.current.length && habitsRef.current.length > 0) {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#718b78', '#d5ae69', '#064f4b', '#e5ede4']
        });
      }
    },
    [scheduleDaySave]
  );

  // Update gratitude
  const updateGratitude = useCallback(
    (val: string) => {
      const nextDay = { ...dayDataRef.current, gratitude: val };
      setDayData(nextDay);
      scheduleDaySave(nextDay);
    },
    [scheduleDaySave]
  );

  // Update reflection
  const updateReflection = useCallback(
    (val: string) => {
      const nextDay = { ...dayDataRef.current, reflection: val };
      setDayData(nextDay);
      scheduleDaySave(nextDay);
    },
    [scheduleDaySave]
  );

  // Save modified habits
  const saveHabits = useCallback(
    async (newList: string[]): Promise<boolean> => {
      const sanitized = [...new Set(newList.map((x) => x.trim()).filter(Boolean))].slice(0, 15);
      if (!sanitized.length) return false;

      const oldHabits = habitsRef.current;
      const oldChecks = dayDataRef.current.checks;
      const oldIntentions = intentionsListRef.current;

      const checkedNames = oldHabits.filter((_, i) => oldChecks.includes(i));
      const nextChecks = sanitized
        .map((h, i) => (checkedNames.includes(h) ? i : -1))
        .filter((i) => i >= 0);

      // Preserve existing reminder settings for habits that match by name
      const nextIntentions: IntentionItem[] = sanitized.map((name, i) => {
        const matched = oldIntentions.find((it) => it.name === name);
        if (matched) return matched;
        return {
          id: `intent_${Date.now()}_${i}`,
          name,
          reminderEnabled: false,
          reminderTime: '09:00',
          reminderDays: ['daily'],
          reminderNote: `Time to gently ${name.toLowerCase()}.`
        };
      });

      const nextDay: DayData = { ...dayDataRef.current, checks: nextChecks };
      setHabits(sanitized);
      setIntentionsList(nextIntentions);
      setDayData(nextDay);

      const currentUser = userRef.current;
      if (!currentUser) return true;

      if (currentUser.isGuest) {
        saveGuestStorage(
          sanitized,
          nextIntentions,
          nextDay,
          journal,
          notificationSettingsRef.current
        );
        return true;
      }

      try {
        const settingsRef = doc(db, 'users', currentUser.uid, 'profile', 'preferences');
        const dailyRef = doc(db, 'users', currentUser.uid, 'dailyCheckins', todayKey);
        await setDoc(
          settingsRef,
          {
            habits: sanitized,
            intentionsList: nextIntentions,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
        await setDoc(
          dailyRef,
          { checks: nextChecks, updatedAt: serverTimestamp() },
          { merge: true }
        );
        return true;
      } catch (e) {
        console.error('Error saving intentions:', e);
        return false;
      }
    },
    [journal, saveGuestStorage, todayKey]
  );

  // Update single intention (e.g. reminder toggle / time)
  const updateIntentionItem = useCallback(
    async (id: string, updates: Partial<IntentionItem>): Promise<boolean> => {
      const nextList = intentionsListRef.current.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      setIntentionsList(nextList);

      const currentUser = userRef.current;
      if (!currentUser) return true;

      if (currentUser.isGuest) {
        saveGuestStorage(
          habitsRef.current,
          nextList,
          dayDataRef.current,
          journal,
          notificationSettingsRef.current
        );
        return true;
      }

      try {
        const settingsRef = doc(db, 'users', currentUser.uid, 'profile', 'preferences');
        await setDoc(
          settingsRef,
          { intentionsList: nextList, updatedAt: serverTimestamp() },
          { merge: true }
        );
        return true;
      } catch (e) {
        console.error('Error updating intention item:', e);
        return false;
      }
    },
    [journal, saveGuestStorage]
  );

  // Update notification settings
  const updateNotificationSettings = useCallback(
    async (updates: Partial<NotificationSettings>): Promise<boolean> => {
      const nextSettings: NotificationSettings = {
        ...notificationSettingsRef.current,
        ...updates
      };
      setNotificationSettings(nextSettings);

      const currentUser = userRef.current;
      if (!currentUser) return true;

      if (currentUser.isGuest) {
        saveGuestStorage(
          habitsRef.current,
          intentionsListRef.current,
          dayDataRef.current,
          journal,
          nextSettings
        );
        return true;
      }

      try {
        const settingsRef = doc(db, 'users', currentUser.uid, 'profile', 'preferences');
        await setDoc(
          settingsRef,
          { notificationSettings: nextSettings, updatedAt: serverTimestamp() },
          { merge: true }
        );
        return true;
      } catch (e) {
        console.error('Error updating notification settings:', e);
        return false;
      }
    },
    [journal, saveGuestStorage]
  );

  // Request permission and register this signed-in device for server Web Push.
  const requestNotifications = useCallback(async (): Promise<NotificationPermission> => {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      await updateNotificationSettings({
        permission: perm,
        enabled: false,
        pushSubscriptionReady: false
      });
      return perm;
    }

    const currentUser = userRef.current;
    if (!currentUser || currentUser.isGuest) {
      await updateNotificationSettings({
        permission: perm,
        enabled: false,
        pushSubscriptionReady: false
      });
      return perm;
    }

    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      const subscription = await subscribeToWebPush(vapidPublicKey);
      const endpoint = subscription.endpoint;
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(endpoint)
      );
      const deviceId = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      const subscriptionRef = doc(db, 'users', currentUser.uid, 'pushSubscriptions', deviceId);
      await setDoc(subscriptionRef, {
        subscription: subscription.toJSON(),
        endpoint,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await updateNotificationSettings({
        permission: perm,
        enabled: true,
        pushSubscriptionReady: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
    } catch (err) {
      console.error('Could not register this device for Web Push:', err);
      await updateNotificationSettings({
        permission: perm,
        enabled: false,
        pushSubscriptionReady: false
      });
    }
    return perm;
  }, [updateNotificationSettings]);

  // Trigger test notification
  const triggerTestNotification = useCallback(async () => {
    return await sendTestNotification(
      'My Fulfilled Life 🌿',
      'This is your gentle reminder. Be where your feet are today.'
    );
  }, []);

  // Add journal entry
  const addJournalEntry = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      const currentUser = userRef.current;
      if (!currentUser) return false;

      const nowISO = new Date().toISOString();

      if (currentUser.isGuest) {
        const newEntry: JournalEntry = {
          id: 'local_' + Date.now(),
          text: trimmed,
          createdAtISO: nowISO
        };
        const nextList = [newEntry, ...journal];
        setJournal(nextList);
        saveGuestStorage(
          habitsRef.current,
          intentionsListRef.current,
          dayDataRef.current,
          nextList,
          notificationSettingsRef.current
        );
        return true;
      }

      try {
        const journalCol = collection(db, 'users', currentUser.uid, 'journal');
        await addDoc(journalCol, {
          text: trimmed,
          createdAt: serverTimestamp(),
          createdAtISO: nowISO
        });
        return true;
      } catch (e) {
        console.error('Error adding journal entry:', e);
        return false;
      }
    },
    [journal, saveGuestStorage]
  );

  // Delete journal entry
  const deleteJournalEntry = useCallback(
    async (id: string): Promise<boolean> => {
      const currentUser = userRef.current;
      if (!currentUser) return false;

      if (currentUser.isGuest) {
        const nextList = journal.filter((item) => item.id !== id);
        setJournal(nextList);
        saveGuestStorage(
          habitsRef.current,
          intentionsListRef.current,
          dayDataRef.current,
          nextList,
          notificationSettingsRef.current
        );
        return true;
      }

      try {
        const docRef = doc(db, 'users', currentUser.uid, 'journal', id);
        await deleteDoc(docRef);
        return true;
      } catch (e) {
        console.error('Error deleting journal entry:', e);
        return false;
      }
    },
    [journal, saveGuestStorage]
  );

  // Export Data
  const exportData = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    let allDays: DayData[] = [];
    let allJournals: JournalEntry[] = [];

    if (currentUser.isGuest) {
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          allDays = parsed.dailyCheckins ? Object.values(parsed.dailyCheckins) : [dayDataRef.current];
          allJournals = parsed.journal || journal;
        }
      } catch (e) {
        allDays = [dayDataRef.current];
        allJournals = journal;
      }
    } else {
      try {
        const [daysSnap, journalSnap] = await Promise.all([
          getDocs(collection(db, 'users', currentUser.uid, 'dailyCheckins')),
          getDocs(collection(db, 'users', currentUser.uid, 'journal'))
        ]);
        allDays = daysSnap.docs.map((d) => ({ ...(d.data() as DayData), date: d.id }));
        allJournals = journalSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
      } catch (e) {
        console.error('Error fetching export docs:', e);
        allDays = [dayDataRef.current];
        allJournals = journal;
      }
    }

    const payload: ExportData = {
      exportedAt: new Date().toISOString(),
      habits: habitsRef.current,
      intentionsList: intentionsListRef.current,
      notificationSettings: notificationSettingsRef.current,
      dailyCheckins: allDays,
      journal: allJournals
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-fulfilled-life-export-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [journal, todayKey]);

  // Import Data
  const importData = useCallback(
    async (jsonStr: string): Promise<{ success: boolean; message: string }> => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed || typeof parsed !== 'object') {
          return { success: false, message: 'Invalid JSON format.' };
        }

        const newHabits = Array.isArray(parsed.habits) ? parsed.habits : habitsRef.current;
        const newIntentions = Array.isArray(parsed.intentionsList)
          ? parsed.intentionsList
          : createDefaultIntentions(newHabits);
        const newJournals: JournalEntry[] = Array.isArray(parsed.journal) ? parsed.journal : [];
        const newDays: DayData[] = Array.isArray(parsed.dailyCheckins) ? parsed.dailyCheckins : [];
        const newNotifs = parsed.notificationSettings || notificationSettingsRef.current;

        setHabits(newHabits);
        setIntentionsList(newIntentions);
        setJournal(newJournals);
        setNotificationSettings(newNotifs);

        const foundToday = newDays.find((d) => d.date === todayKey);
        if (foundToday) {
          setDayData(foundToday);
        }

        const currentUser = userRef.current;
        if (currentUser?.isGuest) {
          const checkinsMap: Record<string, DayData> = {};
          newDays.forEach((d) => {
            if (d.date) checkinsMap[d.date] = d;
          });
          if (!checkinsMap[todayKey]) {
            checkinsMap[todayKey] = foundToday || dayDataRef.current;
          }
          localStorage.setItem(
            GUEST_STORAGE_KEY,
            JSON.stringify({
              habits: newHabits,
              intentionsList: newIntentions,
              dailyCheckins: checkinsMap,
              journal: newJournals,
              notificationSettings: newNotifs
            })
          );
        } else if (currentUser && !currentUser.isGuest) {
          const settingsRef = doc(db, 'users', currentUser.uid, 'profile', 'preferences');
          await setDoc(
            settingsRef,
            {
              habits: newHabits,
              intentionsList: newIntentions,
              notificationSettings: newNotifs,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          for (const d of newDays) {
            if (d.date) {
              const dRef = doc(db, 'users', currentUser.uid, 'dailyCheckins', d.date);
              await setDoc(
                dRef,
                {
                  date: d.date,
                  checks: d.checks || [],
                  gratitude: d.gratitude || '',
                  reflection: d.reflection || '',
                  updatedAt: serverTimestamp()
                },
                { merge: true }
              );
            }
          }
        }

        return {
          success: true,
          message: `Imported ${newHabits.length} intentions, ${newDays.length} days, and ${newJournals.length} journal entries.`
        };
      } catch (err: any) {
        return { success: false, message: `Import error: ${err?.message || 'Failed to read file'}` };
      }
    },
    [todayKey]
  );

  // Sign In with Google
  const signInWithGoogle = async () => {
    try {
      setSyncStatus({ text: 'Opening Google sign-in…' });
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('mfl_guest_active');
      return { success: true };
    } catch (err: any) {
      console.warn('Sign-in error:', err);
      let msg = err.message || 'Failed to sign in';
      if (err.code === 'auth/unauthorized-domain') {
        msg =
          'This preview domain is not in the Firebase Authorized Domains list. You can add it in Firebase Console, or continue seamlessly in Private Local Mode below!';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in window was closed.';
      }
      setSyncStatus({ text: msg, isError: true });
      return { success: false, error: msg };
    }
  };

  // Continue as Guest / Offline
  const continueAsGuest = () => {
    localStorage.setItem('mfl_guest_active', 'true');
    const guestProfile: UserProfile = {
      uid: 'guest_user',
      email: null,
      displayName: 'Mindful Friend',
      photoURL: null,
      isGuest: true
    };
    setUser(guestProfile);
    loadGuestStorage();
  };

  // Sign Out
  const signOutUser = async () => {
    localStorage.removeItem('mfl_guest_active');
    cleanupSubscriptions();
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    setActiveView('home');
  };

  const allCompleted = habits.length > 0 && dayData.checks.length === habits.length;

  return (
    <AppContext.Provider
      value={{
        user,
        isLoadingAuth,
        activeView,
        setActiveView,
        habits,
        intentionsList,
        dayData,
        journal,
        syncStatus,
        dayStatus,
        todayKey,
        todayFormatted,
        notificationSettings,
        signInWithGoogle,
        continueAsGuest,
        signOutUser,
        toggleHabit,
        updateGratitude,
        updateReflection,
        saveHabits,
        updateIntentionItem,
        updateNotificationSettings,
        requestNotifications,
        triggerTestNotification,
        addJournalEntry,
        deleteJournalEntry,
        exportData,
        importData,
        allCompleted
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
