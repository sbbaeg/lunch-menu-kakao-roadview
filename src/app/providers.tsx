'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAppBadge } from '@/hooks/useAppBadge';
import { getFirebaseMessaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import ReactConfetti from 'react-confetti';

import { useRouter } from 'next/navigation';

// This component handles foreground FCM messages and displays toasts.
function FcmListener() {
  const { data: session } = useSession();
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const markAsRead = useAppStore((state) => state.markAsRead);
  const setIsBadgeManagementOpen = useAppStore((state) => state.setIsBadgeManagementOpen);
  const router = useRouter();

  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set dimensions on client side
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && session) {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('>>> [FcmListener] Foreground message received!', payload);

          // Show a toast notification from the data payload
          const { title, body, url, notificationId, type, action } = payload.data || {};
          if (title) {
            // If it's a new badge, show confetti and a toast with a button
            if (type === 'NEW_BADGE') {
              setShowConfetti(true);
              // Delay toast slightly to appear simultaneously with confetti
              setTimeout(() => {
                toast.info(title, {
                  description: body,
                  action: {
                    label: "확인하기",
                    onClick: () => {
                      if (notificationId) {
                        markAsRead(notificationId as string);
                      }
                      setIsBadgeManagementOpen(true);
                    },
                  },
                });
              }, 100); // 100ms delay
            } else {
              // For other notifications, show toast immediately
              toast.info(title, {
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
              });
            }
          }
          
          fetchNotifications();
        });

        return () => {
          unsubscribe();
        };
      }
    }
  }, [session, fetchNotifications, router, markAsRead]);

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={500} // Increased number of pieces for more density
          gravity={0.15}       // Increased gravity for faster fall
          recycle={false}
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

  useEffect(() => {
    if (session) {
      fetchNotifications();

      const handleServiceWorkerMessage = (event: Event) => {
          const messageEvent = event as MessageEvent;
          
          if (messageEvent.data?.type === 'new-notification') {
              fetchNotifications();
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
  }, [session, fetchNotifications]);

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