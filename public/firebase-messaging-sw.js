// Firebase Cloud Messaging Service Worker for Background Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD21GJ1QjLLrI3he70oXC9Tbgmodf5Jv5c",
  authDomain: "routek9-e3f6b.firebaseapp.com",
  projectId: "routek9-e3f6b",
  storageBucket: "routek9-e3f6b.firebasestorage.app",
  messagingSenderId: "36617032545",
  appId: "1:36617032545:web:53ca8974776ab6a5dc2b20"
};

// Immediately claim clients on install/activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

function displayPushNotification(title, body, url, tag) {
  const options = {
    body: body || 'You have a new update in RouteK9.',
    icon: '/assets/favicon.png',
    badge: '/assets/favicon.png',
    tag: tag || `routek9-notif-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: url || '/dispatch-orders'
    }
  };

  return self.registration.showNotification(title || 'RouteK9 Notification', options);
}

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'RouteK9 Notification';
  const body = payload.notification?.body || payload.data?.body || 'You have a new update in RouteK9.';
  const url = payload.data?.url || payload.data?.click_action || payload.fcmOptions?.link || '/dispatch-orders';
  const tag = payload.data?.tag || `routek9-bg-${Date.now()}`;

  displayPushNotification(title, body, url, tag);
});

// Native W3C Push event fallback
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Native push event payload:', payload);
    const title = payload.notification?.title || payload.data?.title || 'RouteK9 Notification';
    const body = payload.notification?.body || payload.data?.body || 'You have a new update in RouteK9.';
    const url = payload.data?.url || payload.data?.click_action || payload.notification?.click_action || '/dispatch-orders';
    const tag = payload.data?.tag || `routek9-push-${Date.now()}`;

    event.waitUntil(displayPushNotification(title, body, url, tag));
  } catch (err) {
    const textData = event.data.text();
    if (textData) {
      event.waitUntil(displayPushNotification('RouteK9 Notification', textData, '/dispatch-orders'));
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dispatch-orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

