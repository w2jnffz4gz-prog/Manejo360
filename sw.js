/* Manejo 360 - funcionamento sem internet.
   Na primeira vez que o app abre COM internet, ele guarda tudo no aparelho.
   Depois disso abre normalmente sem sinal. Quando houver internet, atualiza sozinho. */
var CACHE = 'manejo360-v16';
var ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'config.js', 'nuvem.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (u) { return c.add(u).catch(function () { /* arquivo opcional */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/api/') === 0) return; /* dados da nuvem nunca vão para o cache */
  var pagina = r.mode === 'navigate';
  e.respondWith(
    fetch(r).then(function (res) {
      if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(pagina ? 'index.html' : r, cp); }); }
      return res;
    }).catch(function () {
      return caches.match(pagina ? 'index.html' : r).then(function (m) { return m || caches.match('./'); });
    })
  );
});
