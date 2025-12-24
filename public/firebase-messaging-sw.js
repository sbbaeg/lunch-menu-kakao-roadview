// Import necessary scripts. The order is important.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js'); 

console.log('[firebase-messaging-sw.js] Service Worker starting (v6 - Mark as Read).');

if (typeof firebaseConfig !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully.');

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message: ', payload);

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
          notificationId: notificationData.notificationId, // Pass notificationId
        },
        actions: [
          { action: 'open_url', title: '자세히 보기' }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

  } catch(error) {
     console.error('[firebase-messaging-sw.js] Error during Firebase initialization:', error);
  }
} else {
  console.error('[firebase-messaging-sw.js] FATAL: firebaseConfig variable not found.');
}

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] notificationclick event received.', event.notification.data);
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;
  const notificationId = event.notification.data.notificationId;

  const openWindowPromise = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    for (const client of clientList) {
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    if (clientList.length > 0) {
      return clientList[0].navigate(urlToOpen).then(client => client.focus());
    }
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  const promisesToWait = [openWindowPromise];

  if (notificationId) {
    const markAsReadPromise = fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationIds: [parseInt(notificationId, 10)] }),
    }).then(response => {
      if (!response.ok) {
        console.error('[SW] Failed to mark notification as read. Status:', response.status);
      } else {
        console.log('[SW] Successfully marked notification as read.');
      }
    }).catch(error => {
      console.error('[SW] Error marking notification as read:', error);
    });
    promisesToWait.push(markAsReadPromise);
  }

  event.waitUntil(Promise.all(promisesToWait));
});