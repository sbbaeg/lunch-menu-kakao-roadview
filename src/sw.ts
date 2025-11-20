// src/sw.ts
/// <reference lib="webworker" />
import { clientsClaim, setCacheNameDetails, skipWaiting } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

setCacheNameDetails({
  prefix: 'next-pwa',
  suffix: 'v1', // 캐시 버전 관리를 위한 접미사
});

skipWaiting();
clientsClaim();

// next-pwa가 생성하는 precache manifest를 사용합니다.
precacheAndRoute(self.__WB_MANIFEST || []);

// 푸시 알림 이벤트 리스너
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received!');
  const data = event.data?.json() || {};
  const { title, body, icon, badgeCount } = data; // 서버에서 보낼 페이로드 구조에 따라 변경될 수 있습니다.

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
      // 여기에 더 많은 알림 옵션을 추가할 수 있습니다.
      // 예: vibrate, data, actions, tag
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
