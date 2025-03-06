// Nombre de la caché (cámbialo cuando hagas actualizaciones importantes)
const CACHE_NAME = 'hiram-inflables-v1';

// Archivos que se cachearán de manera estática
const FILES_TO_CACHE = [
  // Páginas principales
  './',
  './index.html',
  './admin.html',
  './config.html',
  './contactanos.html',
  './contrato.html',
  './detallesReserva.html',
  './no-autenticado.html',
  './privacidad.html',
  './productos.html',
  './reservas.html',
  './reservascanceladas.html',
  './reservasconcluidas.html',
  './terminos.html',

  // Archivos JSON/Manifiesto
  './manifest.json',
  './firebase.json',

  // CSS
  './css/styles.css',
  './css/config.css',
  './css/contrato.css',
  './css/productos.css',
  './css/reserva.css',
  './css/resevadetails.css',
  './css/terminados.css',

  // JS
  './js/admin.js',
  './js/app.js',
  './js/config.js',
  './js/contacto.js',
  './js/contrato.js',
  './js/detallesReserva.js',
  './js/firebaseConfig.js',
  './js/main.js',
  './js/reserva.js',
  './js/reserva2.js',
  './js/reservascanceladas.js',
  './js/reservasconcluidas.js',

  // Imágenes / Íconos
  './img/favicon.ico',
  './img/logo.png',
  './img/firma.png'
];

// Instala el Service Worker y cachea los archivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activa el Service Worker inmediatamente tras instalar
  self.skipWaiting();
});

// Activa el Service Worker y elimina cachés antiguas si cambió el nombre
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Permite que el SW tome control de las páginas
  self.clients.claim();
});

// Intercepta las peticiones para servir archivos desde caché
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si lo tenemos en caché, lo retornamos; si no, lo pedimos a la red
      return cachedResponse || fetch(event.request);
    })
  );
});
