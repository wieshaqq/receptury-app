const CACHE_NAME = "przeroboofka-v1";

const ASSETS = [
    "/",
    "/index.html",
    "/script.js",
    "/style.css",
    "/defaultRecipes.json",
    "/manifest.json"
];

// Instalacja — cache wszystkich plików
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Aktywacja — usuń stary cache
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — serwuj z cache gdy offline
self.addEventListener("fetch", (event) => {
    // Nie cachuj zapytań do API
    if (event.request.url.includes("/api/")) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request);
        })
    );
});
