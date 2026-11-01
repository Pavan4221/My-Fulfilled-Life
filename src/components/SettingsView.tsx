import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    user,
    exportData,
    importData,
    signOutUser,
    setActiveView,
    notificationSettings,
    updateNotificationSettings,
    requestNotifications,
    triggerTestNotification
  } = useApp();

  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setBackupStatus('Preparing export file…');
    try {
      await exportData();
      setBackupStatus('Your data export has downloaded successfully.');
    } catch (e: any) {
      setBackupStatus('Export failed. Check your connection.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupStatus('Reading backup file…');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await importData(content);
      setBackupStatus(res.message);
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => {
      setBackupStatus('Failed to read file.');
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleEnableNotifications = async () => {
    setNotifStatus('Requesting browser permission…');
    const perm = await requestNotifications();
    if (perm === 'granted') {
      if (user?.isGuest) {
        setNotifStatus('Device permission granted. Sign in with Google to enable reminders while MFL is closed.');
      } else if (notificationSettings.pushSubscriptionReady) {
        setNotifStatus('Permission granted. Device registration was attempted; server delivery will be verified after the scheduler is configured.');
      } else {
        setNotifStatus('Permission granted. Device registration may need the VAPID key configured; check the browser console if setup fails.');
      }
    } else if (perm === 'denied') {
      setNotifStatus(
        'Permission was blocked. Please enable notification permissions in your browser or phone settings.'
      );
    } else {
      setNotifStatus('Permission prompt closed without response.');
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    setNotifStatus('Sending test notification…');
    const res = await triggerTestNotification();
    setNotifStatus(res.message);
    setIsTestingNotif(false);
  };

  return (
    <div className="space-y-4">
      {/* View Heading */}
      <div className="py-2 px-1">
        <button
          onClick={() => setActiveView('home')}
          className="mb-3 px-3 py-1.5 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#30433a] text-xs font-semibold cursor-pointer transition-colors"
        >
          ← Home
        </button>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#778078]">
          YOUR ACCOUNT & NOTIFICATIONS
        </div>
        <h2 className="font-serif-title font-medium text-2xl sm:text-3xl text-[#1f3833] mt-1 mb-1">
          Settings
        </h2>
        <p className="text-sm text-[#778078]">
          Your account, push notifications, and personal data management.
        </p>
      </div>

      <section className="card-calm p-5 sm:p-6 bg-[#fffdf8] space-y-6">
        {/* Account Details */}
        <div>
          <h3 className="font-serif-title text-xl text-[#243b33] mb-1">Account details</h3>
          <div className="p-4 rounded-xl bg-[#f7f5ed] border border-[#e8e5dc] text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#778078]">Profile:</span>
              <span className="font-medium text-[#20362c]">
                {user?.displayName || 'User'}
              </span>
            </div>
            {user?.email && (
              <div className="flex items-center justify-between">
                <span className="text-[#778078]">Email:</span>
                <span className="text-[#303b35]">{user.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[#778078]">Storage mode:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#e5ede4] text-[#1e483e]">
                {user?.isGuest ? 'Private Local Storage' : 'Firebase Cloud Sync'}
              </span>
            </div>
          </div>
        </div>

        {/* Push Notifications & Reminders */}
        <div className="pt-2">
          <h3 className="font-serif-title text-xl text-[#243b33] mb-1">
            Push Notifications & Reminders
          </h3>
          <p className="text-xs text-[#778078] mb-4 leading-relaxed">
            Receive gentle reminders for your intentions, morning check-in, and evening reflection. For signed-in accounts, receive reminders on your device even when MFL is closed, once server delivery is configured.
          </p>

          <div className="p-4 rounded-xl bg-[#f7f8f4] border border-[#e2e7df] space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#55635a] font-medium">Device Permission:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                  notificationSettings.permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : notificationSettings.permission === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {notificationSettings.permission === 'granted'
                  ? 'Granted ✓'
                  : notificationSettings.permission === 'denied'
                  ? 'Blocked / Denied'
                  : 'Not Enabled Yet'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2.5">
              {notificationSettings.permission !== 'granted' ? (
                <button
                  onClick={handleEnableNotifications}
                  className="py-2.5 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Enable Push Notifications
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  disabled={isTestingNotif}
                  className="py-2.5 px-4 rounded-xl bg-[#718b78] hover:bg-[#607766] disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {isTestingNotif ? 'Sending…' : '🔔 Test This Device'}
                </button>
              )}
            </div>

            {notifStatus && (
              <p className="text-xs text-[#426450] font-medium" role="status">
                {notifStatus}
              </p>
            )}

            {/* Morning Check-In reminder */}
            <div className="pt-3 border-t border-[#e2e7df] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <div className="font-semibold text-[#253b32]">Morning Check-In</div>
                <div className="text-[#778078]">A quiet prompt to begin your day</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notificationSettings.morningReminder?.time || '08:00'}
                  onChange={(e) =>
                    updateNotificationSettings({
                      morningReminder: {
                        enabled: notificationSettings.morningReminder?.enabled ?? true,
                        time: e.target.value
                      }
                    })
                  }
                  className="px-2 py-1 rounded-lg border border-[#cfcdc5] bg-white text-xs font-mono"
                />
                <button
                  onClick={() =>
                    updateNotificationSettings({
                      morningReminder: {
                        enabled: !notificationSettings.morningReminder?.enabled,
                        time: notificationSettings.morningReminder?.time || '08:00'
                      }
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    notificationSettings.morningReminder?.enabled
                      ? 'bg-[#718b78] text-white'
                      : 'bg-[#ece9e0] text-[#778078]'
                  }`}
                >
                  {notificationSettings.morningReminder?.enabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Evening Reflection reminder */}
            <div className="pt-3 border-t border-[#e2e7df] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <div className="font-semibold text-[#253b32]">Evening Reflection</div>
                <div className="text-[#778078]">Pause for gratitude and winding down</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notificationSettings.eveningReminder?.time || '20:30'}
                  onChange={(e) =>
                    updateNotificationSettings({
                      eveningReminder: {
                        enabled: notificationSettings.eveningReminder?.enabled ?? true,
                        time: e.target.value
                      }
                    })
                  }
                  className="px-2 py-1 rounded-lg border border-[#cfcdc5] bg-white text-xs font-mono"
                />
                <button
                  onClick={() =>
                    updateNotificationSettings({
                      eveningReminder: {
                        enabled: !notificationSettings.eveningReminder?.enabled,
                        time: notificationSettings.eveningReminder?.time || '20:30'
                      }
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    notificationSettings.eveningReminder?.enabled
                      ? 'bg-[#718b78] text-white'
                      : 'bg-[#ece9e0] text-[#778078]'
                  }`}
                >
                  {notificationSettings.eveningReminder?.enabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#778078] pt-1">
              Timezone: <span className="font-mono text-[#303b35]">{notificationSettings.timezone}</span>
            </div>
          </div>
        </div>

        {/* Data Backup & Export */}
        <div className="pt-2">
          <h3 className="font-serif-title text-xl text-[#243b33] mb-1">Your personal data</h3>
          <p className="text-xs text-[#778078] mb-4 leading-relaxed">
            Your data belongs to you. You can export a full JSON backup of your intentions, reminders, daily check-ins, and journal entries anytime, or restore from a previous backup file.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="py-2.5 px-4 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#303b35] font-semibold text-xs transition-colors cursor-pointer"
            >
              {isExporting ? 'Exporting…' : 'Export my data (JSON)'}
            </button>

            <button
              onClick={handleImportClick}
              className="py-2.5 px-4 rounded-xl bg-[#e5ede4] hover:bg-[#d8e3d6] text-[#303b35] font-semibold text-xs transition-colors cursor-pointer"
            >
              Import backup file
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {backupStatus && (
            <p className="text-xs text-[#52775f] mt-3 font-medium" role="status">
              {backupStatus}
            </p>
          )}
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-[#e8e5dc] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#243b33]">Sign out</div>
            <div className="text-xs text-[#778078]">Safely sign out from this device.</div>
          </div>
          <button
            onClick={signOutUser}
            className="py-2 px-4 rounded-xl bg-[#f0f0e9] hover:bg-[#e2e2d9] text-[#7d362d] font-semibold text-xs transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
};
