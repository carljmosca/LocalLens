const CACHE_NAME = 'locallens-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pois.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Service Worker: Cache failed', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // For AI model files and other large assets, try network first
        if (event.request.url.includes('huggingface.co') || 
            event.request.url.includes('.onnx') ||
            event.request.url.includes('.json') && event.request.url.includes('config')) {
          return fetch(event.request)
            .then(response => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(err => {
              console.log('Service Worker: Network fetch failed, checking cache:', err);
              return caches.match(event.request);
            });
        }

        // For other requests, try network with cache fallback
        return fetch(event.request)
          .then(response => {
            // Cache successful responses for static assets
            if (response.status === 200 && 
                (event.request.url.includes('.js') || 
                 event.request.url.includes('.css') || 
                 event.request.url.includes('.png') || 
                 event.request.url.includes('.jpg'))) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(err => {
            console.log('Service Worker: Network request failed:', err);
            // Return a custom offline page if available
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Handle AI model downloads with progress tracking
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_AI_MODEL') {
    const { url, modelName } = event.data;
    
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                cache.put(url, response.clone());
                // Notify the client that caching is complete
                event.ports[0].postMessage({
                  type: 'MODEL_CACHED',
                  modelName: modelName
                });
                return response;
              }
              throw new Error('Failed to cache model');
            });
        })
        .catch(err => {
          console.error('Failed to cache AI model:', err);
          event.ports[0].postMessage({
            type: 'MODEL_CACHE_FAILED',
            modelName: modelName,
            error: err.message
          });
        })
    );
  }
});