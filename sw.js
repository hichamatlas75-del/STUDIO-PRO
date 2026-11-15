/* ==========================================================================
   InMenu Studio Pro — Service Worker PWA (100% Hors-Ligne & Cache-First)
   Version: 4.0.0
   ========================================================================== */

const CACHE_NAME = 'inmenu-studio-pro-v4.0';

const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'manifest.json',
    'css/tailwind.min.css',
    'css/styles.css',
    'vendor/fonts/google-fonts.css',
    'vendor/fonts/font_1.woff2',
    'vendor/fonts/font_2.woff2',
    'vendor/fonts/font_3.woff2',
    'vendor/fonts/font_4.woff2',
    'vendor/fonts/font_5.woff2',
    'vendor/fonts/font_6.woff2',
    'vendor/fonts/font_7.woff2',
    'vendor/fonts/font_8.woff2',
    'vendor/fonts/font_9.woff2',
    'vendor/fonts/font_10.woff2',
    'vendor/fonts/font_11.woff2',
    'vendor/fonts/font_12.woff2',
    'vendor/fonts/font_13.woff2',
    'vendor/fonts/font_14.woff2',
    'vendor/fonts/font_15.woff2',
    'vendor/fonts/font_16.woff2',
    'vendor/fontawesome/css/all.min.css',
    'vendor/fontawesome/webfonts/fa-solid-900.woff2',
    'vendor/fontawesome/webfonts/fa-regular-400.woff2',
    'vendor/fontawesome/webfonts/fa-brands-400.woff2',
    'vendor/jspdf.umd.min.js',
    'vendor/mammoth.browser.min.js',
    'js/utils.js',
    'js/grey-corner-data.js',
    'js/word-importer.js',
    'js/illustrations-pack.js',
    'js/engine.js',
    'js/indesign-templates.js',
    'js/print-exporter.js',
    'js/app-core.js',
    'js/app-canvas.js',
    'js/app-inspector.js',
    'js/app-db-word.js',
    'js/app-modals.js',
    'js/app-io.js',
    'js/app.js',
    'icons/icon.svg',
    'icons/icon-maskable.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable.png',
    'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
            });
        })
    );
});
