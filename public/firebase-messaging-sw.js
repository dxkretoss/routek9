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

const recentSwPushes = new Map();

// Synchronize with active tabs via BroadcastChannel to prevent duplicate notifications
if (typeof BroadcastChannel !== 'undefined') {
  try {
    const swNotifChannel = new BroadcastChannel('routek9_notif_channel');
    swNotifChannel.onmessage = (event) => {
      if (event.data && event.data.tag) {
        recentSwPushes.set(event.data.tag, event.data.time || Date.now());
      }
    };
  } catch (e) {
    console.warn('[firebase-messaging-sw.js] BroadcastChannel notice:', e);
  }
}

function displayPushNotification(title, body, url, tag) {
  const combinedText = `${title || ''} ${body || ''}`;
  const orderMatch = combinedText.match(/RK-[A-Za-z0-9]+|ORD-[A-Za-z0-9]+/i);
  const dedupTag = orderMatch ? `order-${orderMatch[0].toUpperCase()}` : (tag || 'routek9-general');

  const now = Date.now();
  if (recentSwPushes.has(dedupTag) && (now - recentSwPushes.get(dedupTag) < 45000)) {
    console.log('[firebase-messaging-sw.js] Suppressed duplicate SW notification for:', dedupTag);
    return Promise.resolve();
  }
  recentSwPushes.set(dedupTag, now);

  const options = {
    body: body || 'You have a new update in RouteK9.',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: dedupTag,
    renotify: false,
    requireInteraction: false,
    data: {
      url: url || '/dispatch-orders'
    }
  };

  return self.registration.showNotification(title || 'RouteK9 Notification', options);
}

messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  // If the push message already had a notification block, Chrome handles it natively with tag deduplication
  if (payload.notification) {
    return;
  }

  const title = payload.data?.title || 'RouteK9 Notification';
  const body = payload.data?.body || 'You have a new update in RouteK9.';
  const url = payload.data?.url || payload.data?.click_action || '/dispatch-orders';
  const tag = payload.data?.tag || payload.data?.orderRef || null;

  const combinedText = `${title || ''} ${body || ''}`;
  const orderMatch = combinedText.match(/RK-[A-Za-z0-9]+|ORD-[A-Za-z0-9]+/i);
  const dedupTag = orderMatch ? `order-${orderMatch[0].toUpperCase()}` : (tag || 'routek9-general');

  const now = Date.now();
  if (recentSwPushes.has(dedupTag) && (now - recentSwPushes.get(dedupTag) < 45000)) {
    console.log('[firebase-messaging-sw.js] Order already displayed by active tab. Suppressing duplicate:', dedupTag);
    return;
  }

  // Only display service worker background notification if NO RouteK9 web tabs are open
  try {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windowClients && windowClients.length > 0) {
      console.log('[firebase-messaging-sw.js] Web tab is open; suppressing duplicate SW background push banner.');
      recentSwPushes.set(dedupTag, now);
      return;
    }
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Clients check error:', err);
  }

  return displayPushNotification(title, body, url, dedupTag);
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
