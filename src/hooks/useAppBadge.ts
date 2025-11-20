'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';

// TODO: Replace with your actual Firebase configuration from your project settings.
// These values should be stored in environment variables (e.g., .env.local)
// and prefixed with NEXT_PUBLIC_ to be accessible on the client-side.


export function useAppBadge() {
  const showAppBadge = useAppStore((state) => state.showAppBadge);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- 디버깅용 토스트 메시지 ---
  toast.info(`Firebase API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Loaded' : 'NOT LOADED'}`);
  // -----------------------------

  // Initialize Firebase App
  const messaging = getFirebaseMessaging();

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
          toast.info('알림 권한이 허용되었습니다.'); // 1. 'granted' 블록 진입 확인

          // 서비스 워커 등록을 기다립니다. next-pwa가 처리할 것으로 예상
          toast.info('서비스 워커 준비를 기다리는 중...'); // 2. serviceWorker.ready 이전
          navigator.serviceWorker.ready.then((registration) => {
            toast.success('서비스 워커가 준비되었습니다.'); // 3. serviceWorker.ready 이후
            
            toast.info('FCM 토큰 요청 시작...'); // 4. getToken 호출 이전
            getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // VAPID 키 필요
              serviceWorkerRegistration: registration,
            }).then((currentToken) => {
              if (currentToken) {
                console.log('FCM registration token:', currentToken);
                
                // FCM 토큰을 서버로 전송
                fetch('/api/notifications/register-fcm-token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ token: currentToken }),
                })
                .then(response => {
                  if (response.ok) {
                    toast.success('알림을 위한 기기 등록이 완료되었습니다.');
                    console.log('FCM token sent to server successfully.');
                  } else {
                    toast.error('기기 등록에 실패했습니다.');
                    console.error('Failed to send FCM token to server.');
                  }
                })
                .catch(error => {
                  toast.error('기기 등록 중 오류가 발생했습니다.');
                  console.error('Error sending FCM token to server:', error);
                });

              } else {
                console.log('No registration token available. Request permission to generate one.');
                toast.error('FCM 토큰을 얻을 수 없습니다. 권한을 확인하세요.');
              }
            }).catch((err) => {
              console.error('An error occurred while retrieving token. ', err);
              toast.error(`FCM 토큰 얻기 오류: ${err.message}`); // 5. getToken의 catch 블록
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
