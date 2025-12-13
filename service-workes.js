// Service Worker для PWA менеджера паролей

const CACHE_NAME = 'password-manager-v1.0.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Кэширование ресурсов');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[ServiceWorker] Пропуск ожидания');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker и очистка старых кэшей
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Активация');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Заявление контроля над клиентами');
      return self.clients.claim();
    })
  );
});

// Стратегия кэширования: Cache First, затем Network
self.addEventListener('fetch', event => {
  // Пропуск запросов к данным (чтобы не кэшировать API запросы)
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Для same-origin запросов используется кэширование
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Если ресурс есть в кэше, возвращаем его
          if (response) {
            return response;
          }
          
          // Иначе загрузка из сети
          return fetch(event.request)
            .then(response => {
              // Проверка, валидный ли ответ
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Клонирование ответа
              const responseToCache = response.clone();
              
              // Добавление в кэш
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Если сеть недоступна и ресурса нет в кэше,
              // можно вернуть запасную страницу
              if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
              }
            });
        })
    );
  }
});