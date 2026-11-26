// Service worker : cache hors-ligne (stale-while-revalidate). Change V pour forcer une mise à jour.
const V='scratch-player-v3';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png',
 'vendor/scratch-vm.js','vendor/scratch-render.js','vendor/scratch-audio.js','vendor/scratch-storage.js','vendor/scratch-svg-renderer.js','vendor/extension-worker.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.open(V).then(async c=>{
    const m=await c.match(e.request,{ignoreSearch:true});
    const n=fetch(e.request).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin)c.put(e.request,r.clone());return r}).catch(()=>m);
    return m||n.then(r=>r||c.match('index.html'));
  }));
});
