const CACHE = 'blitzmall-v1';
const ASSETS = ['/', '/index.html', '/static/js/main.chunk.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
