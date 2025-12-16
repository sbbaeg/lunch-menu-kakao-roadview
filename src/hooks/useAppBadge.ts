'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';

export function useAppBadge() {
  const showAppBadge = useAppStore((state) => state.showAppBadge);
  const unreadCount = useAppStore((state) => state.unreadCount);
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);

  const messaging = getFirebaseMessaging();

  // --- FCM 토큰 등록 및 알림 권한 요청 ---
  useEffect(() => {
    if (messaging && typeof window !== 'undefined') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          navigator.serviceWorker.ready.then((registration) => {
            
            getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration,
            }).then((currentToken) => {
              if (currentToken) {
                console.log('FCM registration token:', currentToken);
                
                fetch('/api/notifications/register-fcm-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: currentToken }),
                });

              } else {
                console.log('No registration token available. Request permission to generate one.');
              }
            }).catch((err) => {
              console.error('An error occurred while retrieving token. ', err);
            });
          });

          // 포그라운드에서 푸시 메시지 수신
          onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            toast.info(`새로운 메시지: ${payload.notification?.title || '알림'}`);
            // 메시지를 받으면, 전역 스토어의 fetchNotifications를 호출하여 모든 관련 상태를 업데이트합니다.
            fetchNotifications();
          });

        } else {
          console.log('Notification permission denied.');
        }
      });
    }
  }, [messaging, fetchNotifications]);

  // Update badge when count or setting changes
  useEffect(() => {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      if (showAppBadge && unreadCount > 0) {
        navigator.setAppBadge(unreadCount);
      } else {
        navigator.clearAppBadge();
      }
    }
  }, [unreadCount, showAppBadge]);
}
