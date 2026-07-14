const CACHE = "creatorhub-v1";

const CORE_FILES = [
    "./",
    "./index.html"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(CORE_FILES))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (
                    event.request.method === "GET" &&
                    response.status === 200
                ) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => {
                        cache.put(event.request, copy);
                    });
                }

                return response;
            });
        })
    );
});
