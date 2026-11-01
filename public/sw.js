const CACHE = 'fulfilled-life-v2-8';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fulfilled-life-') && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept or cache Vite development or dependency requests
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/src') ||
    url.search.includes('v=') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  const isPage =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/');

  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
    )
  );
});

// Push notification received from Web Push / FCM
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'My Fulfilled Life 🌿';
  const options = {
    body: data.body || 'A gentle moment for yourself today.',
    icon: new URL('./icon.svg', self.registration.scope).href,
    badge: new URL('./icon.svg', self.registration.scope).href,
    tag: data.tag || 'gentle-intention-reminder',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './',
      timestamp: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const scopeUrl = new URL(self.registration.scope);
    const targetUrl = new URL(
      (event.notification.data && event.notification.data.url) || './',
      scopeUrl
    );

    // Never let notification payloads navigate outside this app's origin/scope.
    if (
      targetUrl.origin !== scopeUrl.origin ||
      !targetUrl.pathname.startsWith(scopeUrl.pathname)
    ) return;

    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (!client.url || !client.url.startsWith(scopeUrl.origin + scopeUrl.pathname)) continue;
      if ('navigate' in client) await client.navigate(targetUrl.href);
      if ('focus' in client) return client.focus();
    }

    if (clients.openWindow) return clients.openWindow(targetUrl.href);
  })());
});
