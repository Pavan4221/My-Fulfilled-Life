export type ViewType = 'home' | 'checkin' | 'journal' | 'intentions' | 'ai' | 'insights' | 'settings';

export interface IntentionItem {
  id: string;
  name: string;
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:mm in 24h format, e.g. "08:30"
  reminderDays?: string[]; // e.g. ['daily'] or specific days
  reminderNote?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission;
  morningReminder?: { enabled: boolean; time: string };
  eveningReminder?: { enabled: boolean; time: string };
  timezone: string;
  subscription?: any;
  updatedAt?: any;
}

export interface DayData {
  date: string;
  checks: number[];
  gratitude: string;
  reflection: string;
  updatedAt?: any;
}

export interface JournalEntry {
  id: string;
  text: string;
  createdAt?: any;
  createdAtISO: string;
}

export interface Preferences {
  habits: string[];
  intentionsList?: IntentionItem[];
  intentionsVersion?: number;
  notificationSettings?: NotificationSettings;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

export interface ExportData {
  exportedAt: string;
  habits: string[];
  intentionsList?: IntentionItem[];
  notificationSettings?: NotificationSettings;
  dailyCheckins: DayData[];
  journal: JournalEntry[];
}
