const CACHE_NAME = 'cityflow-v1';
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
