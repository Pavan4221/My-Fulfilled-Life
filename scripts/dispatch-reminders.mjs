/**
 * Timezone-aware, multi-device Web Push dispatcher.
 *
 * Delivery is at-least-once: a durable per-device claim prevents normal
 * duplicate cron runs. A process crash after the push provider accepts a
 * message but before Firestore records success can still cause a retry.
 */
import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getDueReminderSlots } from './reminder-schedule.mjs';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@myfulfilledlife.app';
const LOOKBACK_MINUTES = 10;
const CLAIM_LEASE_MS = 15 * 60_000;

if (!serviceAccountKey) {
  console.log('No FIREBASE_SERVICE_ACCOUNT_KEY configured; skipping reminder dispatch.');
  process.exit(0);
}
if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required for push delivery.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must contain the service-account JSON.');
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

function hashId(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isValidSubscription(value) {
  return Boolean(
    value &&
    typeof value.endpoint === 'string' &&
    value.keys &&
    typeof value.keys.p256dh === 'string' &&
    typeof value.keys.auth === 'string'
  );
}

function safeTimeZone(value) {
  const zone = typeof value === 'string' && value ? value : 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return null;
  }
}

async function claimDelivery(claimRef) {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(claimRef);
    const now = Date.now();
    const data = snapshot.exists ? snapshot.data() : null;

    if (data?.status === 'sent') return false;
    if (
      data?.status === 'sending' &&
      data.leaseUntil?.toMillis?.() > now
    ) return false;

    transaction.set(claimRef, {
      status: 'sending',
      attempts: (data?.attempts || 0) + 1,
      leaseUntil: Timestamp.fromMillis(now + CLAIM_LEASE_MS),
      updatedAt: Timestamp.fromMillis(now)
    }, { merge: true });
    return true;
  });
}

async function markSent(claimRef) {
  await claimRef.set({
    status: 'sent',
    sentAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }, { merge: true });
}

async function releaseForRetry(claimRef, error) {
  await claimRef.set({
    status: 'failed',
    lastError: String(error?.message || error).slice(0, 500),
    updatedAt: Timestamp.now()
  }, { merge: true });
}

async function sendToDevice(userRef, subscriptionDoc, slot) {
  const subscription = subscriptionDoc.data()?.subscription;
  if (!isValidSubscription(subscription)) {
    console.warn('Skipping malformed subscription:', subscriptionDoc.id);
    return 'invalid';
  }

  const claimId = hashId(`${slot.key}|${subscriptionDoc.id}`);
  const claimRef = userRef.collection('pushDeliveryClaims').doc(claimId);
  if (!(await claimDelivery(claimRef))) return 'already-claimed';

  const payload = {
    title: slot.title,
    body: slot.body,
    url: './',
    tag: `mfl-${hashId(slot.key).slice(0, 24)}`
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60,
      urgency: 'normal'
    });
    await markSent(claimRef);
    console.log(`Delivered ${slot.kind} reminder to device ${subscriptionDoc.id.slice(0, 8)}`);
    return 'sent';
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode === 404 || statusCode === 410) {
      await Promise.all([
        subscriptionDoc.ref.delete(),
        claimRef.delete()
      ]);
      console.log('Removed an expired or revoked push subscription.');
      return 'expired';
    }

    await releaseForRetry(claimRef, error);
    console.error('Push delivery failed; it may retry during the due window:', error?.message || error);
    return 'failed';
  }
}

async function dispatchReminders() {
  const now = new Date();
  console.log('Starting reminder dispatch at', now.toISOString());

  const usersSnapshot = await db.collection('users').get();
  let sent = 0;
  let failed = 0;
  let expired = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userRef = userDoc.ref;
    const preferencesRef = userRef.collection('profile').doc('preferences');
    const preferencesSnapshot = await preferencesRef.get();
    if (!preferencesSnapshot.exists) continue;

    const preferences = preferencesSnapshot.data() || {};
    const notificationSettings = preferences.notificationSettings || {};
    if (!notificationSettings.enabled) continue;

    const timeZone = safeTimeZone(notificationSettings.timezone);
    if (!timeZone) {
      console.warn('Skipping user with invalid timezone:', userDoc.id);
      continue;
    }

    const slots = getDueReminderSlots(
      notificationSettings,
      preferences.intentionsList || [],
      timeZone,
      now,
      LOOKBACK_MINUTES
    );
    if (!slots.length) continue;

    const subscriptionsSnapshot = await userRef.collection('pushSubscriptions').get();
    if (subscriptionsSnapshot.empty) continue;

    const results = await Promise.allSettled(
      slots.flatMap((slot) =>
        subscriptionsSnapshot.docs.map((subscriptionDoc) =>
          sendToDevice(userRef, subscriptionDoc, slot)
        )
      )
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        failed++;
        console.error('Unexpected device dispatch error:', result.reason?.message || result.reason);
      } else if (result.value === 'sent') sent++;
      else if (result.value === 'failed') failed++;
      else if (result.value === 'expired') expired++;
    }
  }

  console.log(`Dispatch complete. Sent: ${sent}; failed: ${failed}; expired subscriptions removed: ${expired}.`);
}

dispatchReminders().catch((error) => {
  console.error('Reminder dispatcher failed:', error);
  process.exitCode = 1;
});
