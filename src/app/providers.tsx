'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAppBadge } from '@/hooks/useAppBadge';

// This component manages the app badge functionality globally.
function AppBadgeManager() {
  useAppBadge();
  return null; // This component does not render anything.
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const setIsMapReady = useAppStore((state) => state.setIsMapReady);

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
        // Cleanup: remove script and global callback when component unmounts
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
            document.head.removeChild(existingScript);
        }
        delete window.initGoogleMap;
    };
  }, [setIsMapReady]);

  return (
    <SessionProvider>
      <AppBadgeManager />
      {children}
    </SessionProvider>
  );
}