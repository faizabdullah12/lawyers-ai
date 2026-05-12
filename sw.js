// ============================================
// sw.js — Lawyers AI Service Worker v2.0
// Hardened PWA + Push + Offline Cache
// ============================================

const CACHE_NAME = 'lawyers-ai-v2';

// FIX: relative-safe assets
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './konsultasi.html',
  './shared.css',
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // FIX: cache satu-satu supaya tidak gagal total
        for (const asset of ASSETS_TO_CACHE) {
          try {
            await cache.add(asset);
            console.log('[SW] Cached:', asset);
          } catch (err) {
            console.warn('[SW] Failed cache:', asset, err);
          }
        }
      } catch (err) {
        console.error('[SW] Install error:', err);
      }
    })()
  );
});

// ============================================
// ACTIVATE
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();

        await Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );

        await self.clients.claim();

        console.log('[SW] Activated');
      } catch (err) {
        console.error('[SW] Activate error:', err);
      }
    })()
  );
});

// ============================================
// PUSH NOTIFICATION
// ============================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'Lawyers AI',
    body: 'Ada notifikasi baru untuk Anda.',
    icon: './icon-192.png',
    badge: './badge-72.png',
    tag: 'lawyers-ai-notif',
    data: { url: './' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      try {
        data.body = event.data.text();
      } catch (_) {}
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: data.badge || './badge-72.png',
      tag: data.tag || 'lawyers-ai-notif',
      renotify: true,
      data: data.data || { url: './' },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    })
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || './';

  if (event.action === 'open_chat') {
    event.waitUntil(openOrFocus('./chat-advokat.html'));
    return;
  }

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(openOrFocus(targetUrl));
});

// ============================================
// OPEN / FOCUS WINDOW
// ============================================
async function openOrFocus(url) {
  try {
    const clientsArr = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    const origin = self.location.origin;
    const fullUrl = url.startsWith('http')
      ? url
      : origin + '/' + url.replace(/^\/+/, '');

    for (const client of clientsArr) {
      if (client.url.startsWith(origin)) {

        // FIX: Safari compatibility
        if ('focus' in client) {
          try {
            if ('navigate' in client) {
              await client.navigate(fullUrl);
            }
          } catch (_) {}

          return client.focus();
        }
      }
    }

    return self.clients.openWindow(fullUrl);

  } catch (err) {
    console.error('[SW] openOrFocus error:', err);
  }
}

// ============================================
// MESSAGE EVENTS
// ============================================
self.addEventListener('message', (event) => {

  // UPDATE BADGE
  if (event.data?.type === 'SET_BADGE') {
    const count = Number(event.data.count || 0);

    // FIX: navigator compatibility
    if (
      self.navigator &&
      'setAppBadge' in self.navigator
    ) {
      try {
        if (count > 0) {
          self.navigator.setAppBadge(count);
        } else {
          self.navigator.clearAppBadge();
        }
      } catch (err) {
        console.warn('[SW] Badge error:', err);
      }
    }
  }

  // FORCE UPDATE
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================
// FETCH
// Network First + Cache Fallback
// ============================================
self.addEventListener('fetch', (event) => {

  // hanya GET
  if (event.request.method !== 'GET') return;

  // jangan cache API
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {

        // NETWORK FIRST
        const response = await fetch(event.request);

        // cache hanya response valid
        if (response && response.ok) {
          const clone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone))
            .catch(() => {});
        }

        return response;

      } catch (err) {

        // FALLBACK CACHE
        const cached = await caches.match(event.request);

        if (cached) {
          return cached;
        }

        // fallback halaman utama
        const fallback = await caches.match('./index.html');

        if (fallback) {
          return fallback;
        }

        // fallback terakhir
        return new Response(
          'Offline',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain',
            },
          }
        );
      }
    })()
  );
});
