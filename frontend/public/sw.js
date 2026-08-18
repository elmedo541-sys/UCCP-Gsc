// Minimal service worker. Its main job is simply to exist and be
// registered — Chrome/Android requires an active service worker with a
// fetch handler before it will fire the "beforeinstallprompt" event that
// powers the Download the App button. This intentionally does very
// little caching so it can't accidentally serve stale content after a
// deploy (the app already has its own update-detection logic).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A pass-through fetch handler is required for installability. Cache is
// explicitly disabled here so this never serves a stale cached response —
// every request always goes straight to the network for the current version.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});