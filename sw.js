const CACHE_NAME = 'cityflow-v2'; // Updated version to force refresh
const ASSETS = [
  '/',
  '/index.html',
  '/js/config.js',
  '/js/firebase.js',
  '/js/auth.js',
  '/js/maps.js',
  '/js/gps.js',
  '/js/sensors.js',
  '/js/pothole-detector.js',
  '/js/pothole-confirm.js',
  '/js/crowd-consensus.js',
  '/js/reports.js',
  '/js/realtime.js',
  '/js/co2.js',
  '/js/coins.js',
  '/js/pwa.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Force the new service worker to take over immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Immediately take control of all open tabs
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
