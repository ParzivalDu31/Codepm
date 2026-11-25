const CACHE = 'scratch-player-v2'; // change le numéro pour forcer une mise à jour
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const VENDOR = ['/vendor/scratch-vm.js', '/vendor/scratch-render.js', '/vendor/scratch-audio.js',
  '/vendor/scratch-storage.js', '/vendor/scratch-svg-renderer.js', '/vendor/extension-worker.js'];

// Stocke une réponse en retirant le flag "redirected" (Safari refuse de servir une réponse redirigée à une navigation)
async function put(cache, url) {
  const r = await fetch(url, { cache: 'reload' });
  if (!r.ok) throw new Error(url + ' ' + r.status);
  const clean = r.redirected ? new Response(await r.blob(), { status: 200, headers: r.headers }) : r;
  await cache.put(url, clean);
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(u => put(c, u).catch(() => {})));      // tolérant
    await Promise.all(VENDOR.map(u => put(c, u).catch(() => {})));    // tolérant
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === 'navigate') {
      // Page : toujours servie depuis le cache d'abord (marche sans réseau), mise à jour en arrière-plan
      const hit = (await cache.match('/index.html')) || (await cache.match('/'));
      if (hit) { fetch('/index.html', { cache: 'reload' }).then(r => r.ok && put(cache, '/index.html')).catch(() => {}); return hit; }
      try { return await fetch(req); } catch (_) { return Response.error(); }
    }
    const hit = await cache.match(url.pathname);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok) cache.put(url.pathname, r.clone());
      return r;
    } catch (_) { return Response.error(); }
  })());
});
