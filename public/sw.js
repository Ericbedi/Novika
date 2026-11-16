// AfriBuilder COD - Service Worker PWA & Offline Cache
const CACHE_NAME = "afribuilder-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/manifest.webmanifest"]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "AfriBuilder Notification";
  const options = {
    body: data.body || "Nouvelle mise à jour sur votre boutique COD",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data.url || "/app",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
