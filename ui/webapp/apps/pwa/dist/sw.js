self.addEventListener('install', event => {
  event.waitUntil(caches.open('wifikids-v1').then(cache => cache.addAll(['/','/index.html','/manifest.webmanifest'])));
})
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
})
