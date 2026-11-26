// SacaCuenta service worker.
// Guarda la app en el teléfono para que abra sin internet.
// El HTML se sirve "red primero" para que los usuarios web siempre vean la última versión;
// los demás archivos se sirven de caché (se actualizan en segundo plano).
const CACHE = 'sacacuenta-v23';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './config.js', './fb.js'];

self.addEventListener('install', e => {
  // Uno por uno: si falta un archivo los demás igual se guardan.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navegación (el HTML): red primero, caché como respaldo si no hay conexión.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // El resto: caché primero, y se refresca en segundo plano para la próxima vez.
  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
