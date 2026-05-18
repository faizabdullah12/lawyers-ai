self.addEventListener("install", (event) => {
  console.log("SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW activated");
  event.waitUntil(clients.claim());
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

    data = {
      title: "Pesan Baru",
      body: "Ada pesan baru"
    };

  }

  const title = data.title || "Pesan Baru";

  const options = {
    body: data.body || "Ada pesan masuk",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/badge-72.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "lawyers-ai-chat",
    requireInteraction: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );

});

// =========================
// CLICK NOTIFICATION
// =========================

self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const targetUrl =
    event.notification.data?.url ||
    "/dashboard-mitra.html";

  event.waitUntil(

    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {

        if (client.url.includes(targetUrl)) {
          return client.focus();
        }

      }

      return clients.openWindow(targetUrl);

    })

  );

});
