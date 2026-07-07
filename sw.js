/* Service worker del Simulador REBT: precachea la app para que
   funcione sin conexión una vez visitada. */
const CACHE = 'rebt-v5';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit ||
      fetch(e.request).then(resp => {
        try {
          if (new URL(e.request.url).origin === self.location.origin && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
        } catch (err) {}
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
