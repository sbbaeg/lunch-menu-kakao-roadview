// public/firebase-messaging-sw.js

// 이 스크립트는 next-pwa가 생성하는 sw.js에 의해 importScripts를 통해 로드됩니다.

// 푸시 알림 이벤트 리스너
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received!');
  const data = event.data?.json() || {};
  const { title, body, icon, badgeCount } = data;

  // 뱃지 카운트 업데이트
  if ('setAppBadge' in navigator) {
    if (badgeCount !== undefined) {
      const count = parseInt(badgeCount, 10);
      if (!isNaN(count)) {
        navigator.setAppBadge(count).catch(error => {
          console.error('[Service Worker] Failed to set app badge:', error);
        });
      } else {
        console.warn('[Service Worker] badgeCount is not a parsable number.', badgeCount);
      }
    }
  } else {
    console.warn('[Service Worker] Badging API not supported.');
  }

  // 알림 표시
  event.waitUntil(
    self.registration.showNotification(title || '알림', {
      body: body || '새로운 알림이 도착했습니다.',
      icon: icon || '/icon.png',
    }).then(() => {
        // Broadcast a message to all open clients
        console.log('[Service Worker] Broadcasting "new-notification" message to clients.');
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                client.postMessage({ type: 'new-notification' });
            }
        });
    })
  );
});

// 알림 클릭 이벤트 리스너
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // 알림 닫기

  event.waitUntil(
    self.clients.openWindow('/') // 알림 클릭 시 메인 페이지로 이동
  );
});
