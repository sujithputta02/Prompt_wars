// Service Worker placeholder
// This file prevents 404 errors when browser looks for service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
