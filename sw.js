// Akiba Service Worker (Paused)
// Service Worker registration is currently disabled in index.html to prevent 
// origin mismatch errors in sandboxed development environments.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
