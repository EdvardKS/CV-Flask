const SHELL_CACHE = 'padel-scout-shell-v1';
const ASSET_CACHE = 'padel-scout-assets-v1';
const SHELL_URLS = [
    '/errores',
    '/resumen',
    '/static/css/padel-dashboard.css',
    '/static/js/player-session.js',
    '/static/js/errores.js',
    '/static/js/resumen.js',
    '/static/pwa/register-sw.js',
    '/static/favicon.ico',
    '/static/pwa/icons/icon-192.png',
    '/static/pwa/icons/icon-512.png',
    '/static/pwa/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const allowedCaches = [SHELL_CACHE, ASSET_CACHE];

    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => !allowedCaches.includes(key))
                .map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

function isTrackedNavigation(request, url) {
    return request.mode === 'navigate' && (url.pathname === '/errores' || url.pathname === '/resumen');
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const networkPromise = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    if (cachedResponse) {
        return cachedResponse;
    }

    return networkPromise;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    if (isTrackedNavigation(request, url)) {
        event.respondWith(networkFirst(request, SHELL_CACHE));
        return;
    }

    if (url.pathname.startsWith('/static/')) {
        event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    }
});
