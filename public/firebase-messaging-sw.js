// Import necessary scripts. The order is important.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js'); 

console.log('[firebase-messaging-sw.js] Service Worker starting (v5 - Focused Fix).');

if (typeof firebaseConfig !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully.');

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message: ', payload);

      // ** FIX: Handle both FCM payload (nested in .data) and DevTools payload (direct) **
      const notificationData = payload.data || payload;

      const notificationTitle = notificationData.title;
      const notificationBody = notificationData.body;

      if (!notificationTitle) {
        console.error('[firebase-messaging-sw.js] No title found in payload. Cannot show notification.');
        return;
      }

      const notificationOptions = {
        body: notificationBody,
        icon: '/icon.png',
        data: {
          url: notificationData.url || '/',
        },
      };

      // Display the notification. The browser handles waiting for this promise.
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

  } catch(error) {
     console.error('[firebase-messaging-sw.js] Error during Firebase initialization:', error);
  }
} else {
  console.error('[firebase-messaging-sw.js] FATAL: firebaseConfig variable not found.');
}

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
