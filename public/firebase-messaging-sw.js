// public/firebase-messaging-sw.js

// Import the Firebase libraries for Firebase products that you want to use in your SW.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Fetch the Firebase configuration from our custom API endpoint
let firebaseConfig = {};
fetch('/api/firebase-config')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.statusText}`);
    }
    return response.json();
  })
  .then(config => {
    firebaseConfig = config;
    if (Object.values(firebaseConfig).some(value => !value)) {
      console.error('Firebase configuration is incomplete from API.');
      return;
    }
    
    // Initialize the Firebase app in the service worker by passing the generated config
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);

      // Customize notification here
      const notificationTitle = payload.data.title || '새 알림';
      const notificationOptions = {
        body: payload.data.body || '새로운 알림이 도착했습니다.',
        icon: '/icon.png',
        badge: '/icon.png',
        data: payload.data, // Attach the full data payload
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

  })
  .catch(error => {
    console.error('Error fetching or initializing Firebase in service worker:', error);
  });

// Optionally, handle other events like 'notificationclick'
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  // Handle opening a URL based on notification data
  if (event.action === 'open_url' && event.notification.data && event.notification.data.url) {
    clients.openWindow(event.notification.data.url);
  } else {
    // Default: open the root URL or a specific path
    clients.openWindow('/'); 
  }
});

// To avoid caching issues during development, consider adding a versioning or cache busting mechanism
// For production, ensure proper caching strategies are in place for the service worker itself.