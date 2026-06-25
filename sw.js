const CACHE_NAME = 'al-muhandis-v3';
const CORE_FILES = [
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/utils.js',
  '/js/tools-data.js'
];
const OFFLINE_PAGE = '/index.html';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request).catch(function() {
        return caches.match(OFFLINE_PAGE);
      })
    );
    return;
  }

  var isCoreFile = CORE_FILES.some(function(path) {
    return url.pathname === path || url.pathname.endsWith(path);
  });

  var isToolPage = url.pathname.indexOf('/tools/') !== -1;

  if (isCoreFile) {
    event.respondWith(cacheFirst(request));
  } else if (isToolPage) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    return cached || fetch(request).then(function(response) {
      return response;
    });
  });
}

function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      return cached || caches.match(OFFLINE_PAGE);
    });
  });
}
