self.addEventListener("install", (event) => {

  console.log("SW installed");

  self.skipWaiting();

});

self.addEventListener("activate", (event) => {

  console.log("SW activated");

  event.waitUntil(

    (async () => {

      // aktifkan semua tab
      await clients.claim();

      // hapus cache lama
      const keys = await caches.keys();

      await Promise.all(
        keys.map(key => caches.delete(key))
      );

      // TEST notif activate
      await self.registration.showNotification(
        "SW ACTIVE",
        {
          body: "Service Worker aktif",
          icon: "https://lawyers-ai-faiz-abdullahs-projects-e95c3533.vercel.app/icon-192.png"
        }
      );

    })()

  );

});

// =========================
// PUSH RECEIVED
// =========================

self.addEventListener("push", (event) => {

  console.log("PUSH RECEIVED");

  let data = {};

  try {

    data = event.data.json();

  } catch (e) {

    console.error("PUSH PARSE ERROR:", e);

    data = {
      title: "Pesan Baru",
      body: "Ada pesan baru"
    };

  }

  console.log("PUSH DATA:", data);

  const title =
    data.title || "Pesan Baru";

  const options = {

    body:
      data.body || "Ada pesan masuk",

    icon:
      "https://lawyers-ai-faiz-abdullahs-projects-e95c3533.vercel.app/icon-192.png",

    badge:
      "https://lawyers-ai-faiz-abdullahs-projects-e95c3533.vercel.app/badge-72.png",

    vibrate: [200, 100, 200],

    tag:
      data.tag || "lawyers-ai-chat",

    renotify: true,

    requireInteraction: true,

    data:
      data.data || {
        url: "https://lawyers-ai-faiz-abdullahs-projects-e95c3533.vercel.app/dashboard-mitra.html"
      }

  };

  event.waitUntil(

    self.registration.showNotification(
      title,
      options
    )

  );

});

// =========================
// CLICK NOTIFICATION
// =========================

self.addEventListener(
  "notificationclick",
  (event) => {

    console.log("NOTIFICATION CLICK");

    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "https://lawyers-ai-faiz-abdullahs-projects-e95c3533.vercel.app/dashboard-mitra.html";

    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then((clientList) => {

        for (const client of clientList) {

          if (
            client.url.includes(targetUrl)
          ) {

            return client.focus();

          }

        }

        return clients.openWindow(
          targetUrl
        );

      })

    );

  }
);

// =========================
// OPTIONAL DEBUG
// =========================

self.addEventListener("message", (event) => {

  console.log("SW MESSAGE:", event.data);

});
