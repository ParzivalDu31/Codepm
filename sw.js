const CACHE = 'scratch-player-v1'; // change le numéro pour forcer une mise à jour
const FILES = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png',
  '/vendor/scratch-vm.js', '/vendor/scratch-render.js', '/vendor/scratch-audio.js',
  '/vendor/scratch-storage.js', '/vendor/scratch-svg-renderer.js', '/vendor/extension-worker.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() =>
    e.request.mode === 'navigate' ? caches.match('/index.html') : Response.error())));
});
