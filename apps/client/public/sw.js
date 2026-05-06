const CACHE_NAME = "prevent-auto-pwa-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo-branco.svg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/index.html", responseClone))
            .catch(() => undefined);
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match("/index.html");
          return cachedResponse || Response.error();
        }),
    );
    return;
  }

  if (!["script", "style", "image", "font", "worker"].includes(request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
              .catch(() => undefined);
          }

          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});
