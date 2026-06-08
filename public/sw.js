self.addEventListener("install", (event) => {
  // Force the new service worker to become the active service worker immediately.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Force the new service worker to immediately take control of all open clients (tabs).
  // This is CRITICAL to bypass the old, broken service worker without requiring a tab close.
  event.waitUntil(self.clients.claim());
  
  // Clear any existing caches from the old service worker just to be absolutely sure.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// A completely passive fetch handler.
// By not calling event.respondWith(), we tell the browser to handle the request normally over the network.
self.addEventListener("fetch", (event) => {
  return;
});
