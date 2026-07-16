const CACHE_NAME = 'expenseflow-v11';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './db.js',
    './phase4.js',
    './phase5.js',
    './phase7.js',
    './category-picker.js',
    './time-picker.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 && networkResponse.status !== 0) {
                        return networkResponse;
                    }
                    // Dynamically cache new assets (including external fonts)
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch(() => {
                    // Fail silently, or return a fallback offline view if needed
                });
            })
    );
});

