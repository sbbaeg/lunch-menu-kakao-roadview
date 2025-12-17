'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAppBadge } from '@/hooks/useAppBadge';
import { getFirebaseMessaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { DebugDisplay } from '@/components/DebugDisplay';

// This component handles foreground FCM messages and displays toasts.
function FcmListener() {
  const { data: session } = useSession();
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const addDebugLog = useAppStore((state) => state.addDebugLog);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && session) {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        addDebugLog('[FcmListener] Setting up foreground message listener...');
        const unsubscribe = onMessage(messaging, (payload) => {
          addDebugLog(`[FcmListener] Foreground message received! Data: ${JSON.stringify(payload.data)}`);
          console.log('>>> [FcmListener] Foreground message received!', payload);

          // Show a toast notification from the data payload
          const { title, body } = payload.data || {};
          if (title) {
            toast.info(title, {
              description: body,
            });
          }
          
          fetchNotifications();
        });

        return () => {
          addDebugLog('[FcmListener] Cleaning up foreground message listener.');
          unsubscribe();
        };
      }
    }
  }, [session, fetchNotifications, addDebugLog]);

  return null;
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
  const addDebugLog = useAppStore((state) => state.addDebugLog);

  useEffect(() => {
    addDebugLog('[Initializer] useEffect triggered.');
    if (session) {
      addDebugLog('[Initializer] Session OK, fetching initial notifications.');
      fetchNotifications();

      const handleServiceWorkerMessage = (event: Event) => {
          const messageEvent = event as MessageEvent;
          addDebugLog(`[Initializer] Message from SW. Type: ${messageEvent.data?.type}`);
          
          if (messageEvent.data?.type === 'new-notification') {
              addDebugLog('[Initializer] "new-notification" received, refetching.');
              fetchNotifications();
          } else if (messageEvent.data?.type === 'debug') {
              addDebugLog(messageEvent.data.message);
          }
      };

      if ('serviceWorker' in navigator) {
          addDebugLog('[Initializer] SW supported. Waiting for SW to be ready...');
          navigator.serviceWorker.ready.then(registration => {
            addDebugLog(`[Initializer] SW is ready. Controller: ${registration.active ? 'ACTIVE' : 'INACTIVE'}`);
            // Add listener here to ensure it's set up after SW is ready.
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
            addDebugLog('[Initializer] "message" listener ADDED.');
          }).catch(error => {
            addDebugLog(`[Initializer] SW Ready registration failed: ${error.message}`);
          });
          
      } else {
        addDebugLog('[Initializer] SW not supported.');
      }

      return () => {
          if ('serviceWorker' in navigator) {
            // No need to wait for .ready to remove, just try to remove.
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            addDebugLog('[Initializer] "message" listener REMOVED.');
          }
          addDebugLog('[Initializer] useEffect cleanup finished.');
      };
    } else {
      addDebugLog('[Initializer] No session found.');
    }
  }, [session, fetchNotifications, addDebugLog]);

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
      <DebugDisplay />
    </SessionProvider>
  );
}