// service-worker.js
const CACHE_NAME = 'imageforge-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Install event - Cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache opened, caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('All files cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(function(error) {
        console.log('Cache failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activated');
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = response.clone();

          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function(error) {
          console.log('Network fetch failed:', error);
          // Return a custom offline page or error message if needed
          return new Response('Offline - Please check your internet connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for future features (optional)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-conversion') {
    // Handle background tasks if needed
    console.log('Background sync triggered');
  }
});