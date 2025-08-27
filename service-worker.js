const CACHE_NAME = 'countdown-pwa-cache-v1';
const urlsToCache = [
  '/countdown-pwa/index.html',
  '/countdown-pwa/manifest.json',
  '/countdown-pwa/service-worker.js',
  '/countdown-pwa/icons/icon-192x192.png',
  '/countdown-pwa/icons/icon-512x512.png'
  // 如果有其他静态资源（如CSS、JS文件），也需要添加到这里
];

// 监听安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 监听激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 确保Service Worker立即控制所有客户端
  return self.clients.claim();
});

// 监听获取事件（拦截网络请求）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有，直接返回缓存的资源
        if (response) {
          return response;
        }
        // 否则，从网络获取
        return fetch(event.request).then((networkResponse) => {
          // 检查响应是否有效
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // 将获取到的资源添加到缓存
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        });
      })
      .catch(() => {
        // 如果网络和缓存都失败了，可以返回一个离线页面
        // 例如：return caches.match('/countdown-pwa/offline.html');
        console.log('Fetch failed for:', event.request.url);
        // 对于本应用，没有特定的离线页面，直接返回空或错误
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
