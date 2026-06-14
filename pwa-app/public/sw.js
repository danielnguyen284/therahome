const CACHE_NAME = 'therahome-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/favicon.png',
  '/images/icon.png',
];

// Install Event - cache core static shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - network first fallback to cache for shell assets
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and skip api/chrome-extension requests
  if (e.request.method !== 'GET' || e.request.url.includes('/api/') || e.request.url.startsWith('chrome-extension')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(e.request);
      })
  );
});

// Push Event - Receive notification payload and display it
self.addEventListener('push', (e) => {
  let data = {
    title: 'TheraHome',
    body: 'Bạn có thông báo mới nhắc nhở chăm sóc sức khỏe cột sống!',
    icon: '/images/icon.png',
    badge: '/images/favicon.png',
    data: { url: '/notifications' }
  };

  if (e.data) {
    try {
      const parsed = e.data.json();
      data = { ...data, ...parsed };
    } catch (err) {
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data || { url: '/notifications' },
    vibrate: [100, 50, 100],
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event - Open/focus PWA window on click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const urlToOpen = new URL(e.notification.data?.url || '/notifications', self.location.origin).href;

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find a client window that is already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
