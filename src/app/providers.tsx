'use client'

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast, type ExternalToast } from 'sonner';
import ReactConfetti from 'react-confetti';
import { BellRing, Award, MessageCircle, Megaphone, Tag } from 'lucide-react';
import Image from 'next/image';

import { useAppStore } from '@/store/useAppStore';
import { useAppBadge } from '@/hooks/useAppBadge';
import { getFirebaseMessaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';


// This component handles foreground FCM messages and displays toasts.
function FcmListener() {
  const { data: session } = useSession();
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const fetchNewBadgesCount = useAppStore((state) => state.fetchNewBadgesCount);
  const markAsRead = useAppStore((state) => state.markAsRead);
  const markNewBadgesAsViewed = useAppStore((state) => state.markNewBadgesAsViewed);
  const setIsBadgeManagementOpen = useAppStore((state) => state.setIsBadgeManagementOpen);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle window resize for confetti dimensions
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial dimensions

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FCM message listener
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && session) {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('>>> [FcmListener] Foreground message received!', payload);

          if (isAdminPage) {
            console.log('>>> [FcmListener] Admin page: Skipping toast and confetti.');
            return;
          }

          // Show a toast notification from the data payload
          const { title, body, url, notificationId, type, action, badgeIconUrl } = payload.data || {};
          if (title) {
            let toastOptions: ExternalToast = {
              description: body,
              action: url ? {
                label: "보러가기",
                onClick: () => {
                  if (notificationId) {
                    markAsRead(notificationId as string);
                  }
                  router.push(url as string);
                },
              } : undefined,
              icon: <BellRing className="h-6 w-6" />, // 기본 아이콘 크기 변경
              classNames: { // 기본 레이아웃 설정
                icon: 'w-6',
                title: 'pl-1',
                description: 'pl-1',
              }
            };

            if (type === 'NEW_BADGE') {
              setShowConfetti(true);
                // 뱃지 알림일 경우 레이아웃 덮어쓰기
                if (badgeIconUrl) {
                  toastOptions.icon = (
                    <div className="flex-shrink-0">
                      <div className="relative h-12 w-12">
                          <Image
                              src={badgeIconUrl as string}
                              alt="뱃지 아이콘"
                              fill
                              sizes="48px"
                              style={{ objectFit: 'contain' }}
                          />
                      </div>
                    </div>
                  );
                  
                  toastOptions.classNames = {
                    icon: 'p-0 m-0', // 아이콘 컨테이너 패딩/마진 초기화
                    title: 'ml-8',   // 텍스트를 오른쪽으로 더 밀기 (ml-4 -> ml-8)
                    description: 'ml-8', // 텍스트를 오른쪽으로 더 밀기
                  };
                } else {
                toastOptions.icon = <Award className="h-6 w-6 text-yellow-500" />; // 크기 변경
              }
              toastOptions.action = {
                label: "확인하기",
                onClick: () => {
                  markNewBadgesAsViewed();
                  setIsBadgeManagementOpen(true);
                },
              };
            } else if (type === 'NEW_REVIEW_COMMENT') {
              toastOptions.icon = <MessageCircle className="h-6 w-6 text-blue-500" />; // 크기 변경
            } else if (type === 'ANNOUNCEMENT') {
              toastOptions.icon = <Megaphone className="h-6 w-6 text-red-500" />; // 크기 변경
            } else if (type === 'TAG_SUBSCRIPTION') { // 태그 구독 알림 (예시)
              toastOptions.icon = <Tag className="h-6 w-6 text-green-500" />; // 크기 변경
            }
            // 다른 타입의 알림이 있다면 else if 블록을 추가합니다.

            // Delay toast slightly to appear simultaneously with confetti for NEW_BADGE
            // 다른 타입은 딜레이 없이 바로 표시
            setTimeout(() => {
              toast.info(title, toastOptions);
            }, type === 'NEW_BADGE' ? 100 : 0);
          }
          
          fetchNotifications();
          fetchNewBadgesCount(); // Fetch new badge count on any new notification
        });

        return () => {
          unsubscribe();
        };
      }
    }
  }, [session, fetchNotifications, fetchNewBadgesCount, router, markAsRead, markNewBadgesAsViewed, isAdminPage]);

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={500} // Increased number of pieces for more density
          gravity={0.15}       // Increased gravity for faster fall
          recycle={false}
          style={{ zIndex: 9999 }}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
    </>
  );
}

// This component manages the app badge functionality globally.
function AppBadgeManager() {
  useAppBadge();
  return null; // This component does not render anything.
}

// This component fetches notifications when the session is available.
function NotificationInitializer() {
  const { data: session } = useSession();
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const fetchNewBadgesCount = useAppStore((state) => state.fetchNewBadgesCount);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      fetchNewBadgesCount();

      const handleServiceWorkerMessage = (event: Event) => {
          const messageEvent = event as MessageEvent;
          
          if (messageEvent.data?.type === 'new-notification') {
              fetchNotifications();
              fetchNewBadgesCount();
          }
      };

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
          }).catch(error => {
            console.error(`[Initializer] SW Ready registration failed: ${error.message}`);
          });
          
      }

      return () => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
          }
      };
    }
  }, [session, fetchNotifications, fetchNewBadgesCount]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const setIsMapReady = useAppStore((state) => state.setIsMapReady);
  const initializeServiceWorker = useAppStore((state) => state.initializeServiceWorker);

  useEffect(() => {
    initializeServiceWorker();
  }, [initializeServiceWorker]);

  // Google Maps JavaScript API 스크립트를 로드하는 useEffect
  useEffect(() => {
    const GOOGLE_MAPS_JS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY;
    if (!GOOGLE_MAPS_JS_KEY) {
      console.error("Google Maps JS key is not set.");
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) {
        if (window.google && window.google.maps) {
            setIsMapReady(true);
        }
        return;
    }

    // Define the global callback function before loading the script
    window.initGoogleMap = () => {
        setIsMapReady(true);
    };

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_JS_KEY}&libraries=places&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onerror = () => {
        console.error("Failed to load the Google Maps script.");
        delete window.initGoogleMap; // Clean up global callback on error
    };

    return () => {
        // Cleanup: remove script when component unmounts
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
            document.head.removeChild(existingScript);
        }
        // No need to delete window.initGoogleMap as providers.tsx is a root component
    };
  }, [setIsMapReady]);

  return (
    <SessionProvider>
      <FcmListener />
      <AppBadgeManager />
      <NotificationInitializer />
      {children}
    </SessionProvider>
  );
}
