// Guarda la app en el teléfono para que abra sin internet.
// Cambia el número de versión cada vez que subas un index.html nuevo.
const CACHE = 'sacacuenta-v15';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './config.js', './fb.js', './native.js'];

self.addEventListener('install', e => {
  // Uno por uno: si falta un archivo (por ejemplo config.js en la versión de prueba) los demás igual se guardan.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
