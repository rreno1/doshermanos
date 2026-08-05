/* Dos Hermanos Catering System — Service Worker */
const CACHE_NAME = 'dos-hermanos-cache-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/main.css',
  './css/components/ui.css',
  './js/app.js',
  './js/config/firebase.js',
  './js/constants/enums.js',
  './js/contracts/validators.js',
  './js/utils/calculations.js',
  './js/utils/dom.js',
  './js/modules/auth/auth-service.js',
  './js/modules/auth/rbac-guard.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first strategy for API & Firebase calls; Cache first for static UI assets
  if (event.request.url.includes('firebase') || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
