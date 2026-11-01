/**
 * Free Cloud Push Notification Dispatcher
 *
 * Runs on GitHub Actions cron for $0.00 (uses 2,000 free runner minutes/month).
 * Queries Firestore for users with due reminders and sends Web Push notifications
 * to wake up mobile (iOS/Android) and desktop devices even when the PWA is closed.
 */

import webpush from 'web-push';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Initialize Firebase Admin if credentials are provided in GitHub Secrets
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@myfulfilledlife.app';

if (!serviceAccountKey) {
  console.log('ℹ️ No FIREBASE_SERVICE_ACCOUNT_KEY secret found. Skipping cloud push run.');
  process.exit(0);
}

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const serviceAccount = JSON.parse(serviceAccountKey);
const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

async function dispatchReminders() {
  console.log('🌿 Starting gentle reminders dispatch run at', new Date().toISOString());

  try {
    const usersSnap = await db.collection('users').get();
    let sentCount = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const prefDoc = await db.doc(`users/${uid}/profile/preferences`).get();

      if (!prefDoc.exists) continue;
      const data = prefDoc.data();
      const notifs = data.notificationSettings;
      const subscription = notifs?.subscription;
      const intentions = data.intentionsList || [];

      if (!subscription || !notifs?.enabled) continue;

      // User's current local time
      const userTimezone = notifs.timezone || 'UTC';
      const now = new Date();
      const userLocalTimeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      console.log(`Checking user ${uid} (Local time: ${userLocalTimeStr} ${userTimezone})`);

      // Check Morning Check-In
      if (notifs.morningReminder?.enabled && notifs.morningReminder.time === userLocalTimeStr) {
        await sendPush(subscription, {
          title: 'Morning Check-In 🌿',
          body: 'Good morning! Set your gentle intentions for today.',
          url: '/#checkin'
        });
        sentCount++;
      }

      // Check Evening Reflection
      if (notifs.eveningReminder?.enabled && notifs.eveningReminder.time === userLocalTimeStr) {
        await sendPush(subscription, {
          title: 'Evening Reflection 🌙',
          body: 'Take a quiet moment of gratitude before winding down.',
          url: '/#checkin'
        });
        sentCount++;
      }

      // Check Intentions
      for (const intent of intentions) {
        if (intent.reminderEnabled && intent.reminderTime === userLocalTimeStr) {
          await sendPush(subscription, {
            title: intent.name || 'Gentle Intention',
            body: intent.reminderNote || `A gentle reminder: ${intent.name}`,
            url: '/#checkin'
          });
          sentCount++;
        }
      }
    }

    console.log(`✓ Reminders dispatch complete. Dispatched ${sentCount} notifications.`);
  } catch (err) {
    console.error('Error dispatching reminders:', err);
  }
}

async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`Sent notification: "${payload.title}"`);
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('Subscription has expired or been revoked by user.');
    } else {
      console.error('Failed to send web push:', err.message);
    }
  }
}

dispatchReminders();
