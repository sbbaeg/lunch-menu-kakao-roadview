// public/firebase-messaging-sw.js

// 이 스크립트는 next-pwa가 생성하는 sw.js에 의해 importScripts를 통해 로드됩니다.

// 푸시 알림 이벤트 리스너
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received!');
  const data = event.data?.json() || {};
  const { title, body, icon, badgeCount } = data;

  // 뱃지 카운트 업데이트
  if ('setAppBadge' in navigator && typeof badgeCount === 'number') {
    navigator.setAppBadge(badgeCount).catch(error => {
      console.error('Failed to set app badge:', error);
    });
  } else {
    console.warn('Badging API not supported or badgeCount is not a number.');
  }

  // 알림 표시
  event.waitUntil(
    self.registration.showNotification(title || '알림', {
      body: body || '새로운 알림이 도착했습니다.',
      icon: icon || '/icon.png',
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
