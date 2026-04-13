// ============================================
// sw.js — Lawyers AI Service Worker v1.0
// Push Notification + Badge + Offline Cache
// ============================================

const CACHE_NAME = 'lawyers-ai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/konsultasi.html',
  '/shared.css',
];

// ── INSTALL ──
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── PUSH NOTIFICATION ──
self.addEventListener('push', event => {
  let data = {
    title: 'Lawyers AI',
    body: 'Ada notifikasi baru untuk Anda.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'lawyers-ai-notif',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon    || '/icon-192.png',
      badge:   data.badge   || '/badge-72.png',
      tag:     data.tag     || 'lawyers-ai-notif',
      renotify: true,
      data:    data.data    || { url: '/' },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  if (event.action === 'open_chat') {
    event.waitUntil(openOrFocus('/chat-advokat.html'));
  } else if (event.action === 'dismiss') {
    // sudah ditutup di atas
  } else {
    event.waitUntil(openOrFocus(targetUrl));
  }
});

async function openOrFocus(url) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const origin  = self.location.origin;
  const fullUrl = url.startsWith('http') ? url : origin + url;

  for (const client of clients) {
    if (client.url.startsWith(origin) && 'focus' in client) {
      await client.navigate(fullUrl);
      return client.focus();
    }
  }
  return self.clients.openWindow(fullUrl);
}

// ── BADGE UPDATE (dari pesan masuk) ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SET_BADGE') {
    const count = event.data.count || 0;
    if ('setAppBadge' in navigator) {
      count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
    }
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── FETCH (Network First, fallback cache) ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return; // jangan cache API calls

  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
