self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('inflables-iram').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/productos.html',
          '/contactanos.html',
          '/admin.html',
          '/css/styles.css',
          '/js/main.js',
          '/js/admin.js',
          '/img/inflable1.jpg',
          '/img/inflable2.jpg',
          '/img/maquinita.jpg'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  