/// <reference path="./types/service-worker.d.ts" />

self.addEventListener('install', (e) => e.waitUntil((
    async () => {
        console.log('[ServiceWorker] Installed');

        // Don't wait for old server worker to shutdown. Instantly take over responsibility for serving requests
        skipWaiting();

        const cache = await caches.open('assets-v1');
        console.log('[ServiceWorker] Caching cacheFiles');
        await cache.addAll([
            '/',
            '/assets/index.css',
            '/src/app.js',
            '/src/controller.js',
            '/src/helpers.js',
            '/src/store-remote.js',
            '/src/template.js',
            '/src/view.js',
            '/src/item.js'
        ]);
    }
)()));

self.addEventListener('activate', (e) => e.waitUntil((
    async () => {
        console.log('[ServiceWorker] Activated');
        await clients.claim();
    }
)()));

self.addEventListener('fetch', (e) => e.respondWith((
    async () => {
        console.log('[ServiceWorker] Fetch:', e.request.url);
        const response = await caches.match(e.request);
        if (response) {
            console.log('[ServiceWorker] Found in Cache:', e.request.url);
            return response;
        }

        try {
            const response = await fetch(e.request);
            
        } catch (err) {

        }


        return response;
    }
)()));
