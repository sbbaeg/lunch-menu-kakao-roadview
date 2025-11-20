'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// TODO: Replace with your actual Firebase configuration from your project settings.
// These values should be stored in environment variables (e.g., .env.local)
// and prefixed with NEXT_PUBLIC_ to be accessible on the client-side.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function useAppBadge() {
  const showAppBadge = useAppStore((state) => state.showAppBadge);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Firebase App
  let messaging: any;
  if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
        toast.info(`Fetched unread count: ${data.unreadCount}`);
      } else {
        toast.error('Failed to fetch unread count: Response not OK');
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      toast.error('Failed to fetch unread count: Exception');
    }
  };

  // --- FCM 토큰 등록 및 알림 권한 요청 ---
  useEffect(() => {
    toast.info('useAppBadge mounted. Fetching count...');
    fetchUnreadCount();

    if (messaging && typeof window !== 'undefined') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // 서비스 워커 등록을 기다립니다. next-pwa가 처리할 것으로 예상
          navigator.serviceWorker.ready.then((registration) => {
            getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // VAPID 키 필요
              serviceWorkerRegistration: registration,
            }).then((currentToken) => {
              if (currentToken) {
                console.log('FCM registration token:', currentToken);
                // TODO: Send the token to your server and store it
                // fetch('/api/notifications/register-fcm-token', {
                //   method: 'POST',
                //   headers: {
                //     'Content-Type': 'application/json',
                //   },
                //   body: JSON.stringify({ token: currentToken }),
                // });
                toast.success('FCM 토큰을 성공적으로 등록했습니다.');
              } else {
                console.log('No registration token available. Request permission to generate one.');
                toast.error('FCM 토큰을 얻을 수 없습니다. 권한을 확인하세요.');
              }
            }).catch((err) => {
              console.error('An error occurred while retrieving token. ', err);
              toast.error('FCM 토큰을 얻는 중 오류가 발생했습니다.');
            });
          });

          // 포그라운드에서 푸시 메시지 수신
          onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast.info(`새로운 메시지: ${payload.notification?.title || '알림'}`);
            // 메시지를 받았을 때 뱃지 카운트를 다시 가져올 수 있습니다.
            fetchUnreadCount();
          });

        } else {
          console.log('Notification permission denied.');
          toast.error('알림 권한이 거부되었습니다.');
        }
      });
    }

    return () => {
        toast.warning('useAppBadge unmounted!');
    }
  }, [messaging]); // messaging 객체가 변경될 때마다 useEffect 재실행

  // Update badge when count or setting changes
  useEffect(() => {
    toast.info(`Badge effect triggered. Count: ${unreadCount}, Show: ${showAppBadge}`);
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      if (showAppBadge && unreadCount > 0) {
        toast.success(`Setting app badge to: ${unreadCount}`);
        navigator.setAppBadge(unreadCount);
      } else {
        toast.warning(`Clearing app badge. Reason: showAppBadge=${showAppBadge}, unreadCount=${unreadCount}`);
        navigator.clearAppBadge();
      }
    } else {
        toast.error('Badging API not supported.');
    }
  }, [unreadCount, showAppBadge]);

  // Refetch when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        toast.info('App became visible. Refetching count...');
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
