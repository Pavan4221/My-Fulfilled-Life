// Notification & Web Push helper service

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isPushSupported = (): boolean => {
  return (
    isNotificationSupported() &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
};

export const sendTestNotification = async (
  title: string = 'My Fulfilled Life 🌿',
  body: string = 'This is your gentle reminder. Take a mindful pause and be where your feet are.'
): Promise<{ success: boolean; message: string }> => {
  if (!isNotificationSupported()) {
    return { success: false, message: 'Notifications are not supported in this browser.' };
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was not granted. Please allow notifications in your browser settings.'
      };
    }
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: './icon.svg',
          badge: './icon.svg',
          tag: 'test-reminder',
          vibrate: [100, 50, 100],
          data: { url: './' }
        } as any);
        return { success: true, message: 'Device test notification displayed. This does not yet test server delivery.' };
      }
    }

    new Notification(title, { body, icon: './icon.svg' });
    return { success: true, message: 'Device test notification displayed. This does not test server delivery.' };
  } catch (err: any) {
    console.warn('Failed to display notification:', err);
    return { success: false, message: err?.message || 'Could not display notification.' };
  }
};

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToWebPush = async (
  vapidPublicKey: string
): Promise<PushSubscription> => {
  if (!isPushSupported()) {
    throw new Error('Web Push is not supported by this browser or device.');
  }
  if (!vapidPublicKey) {
    throw new Error('The VAPID public key is not configured for this deployment.');
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission has not been granted.');
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
  });
};
