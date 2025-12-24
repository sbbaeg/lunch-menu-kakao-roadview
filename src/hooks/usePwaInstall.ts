
"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// TypeScript a definizione per l'evento BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePwaInstall = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [pathWhenShown, setPathWhenShown] = useState<string | null>(null);
  const currentPathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      console.log('[usePwaInstall] beforeinstallprompt event fired');
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
        setShowInstallBanner(true);
        // Record the path where the prompt was first made available.
        setPathWhenShown(window.location.pathname);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Effect to hide banner on navigation
  useEffect(() => {
    if (showInstallBanner && pathWhenShown && currentPathname !== pathWhenShown) {
      setShowInstallBanner(false);
    }
  }, [currentPathname, pathWhenShown, showInstallBanner]);

  const handleInstallClick = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
    
    // Hide the banner regardless of the choice
    setShowInstallBanner(false);
    setInstallPromptEvent(null);
  }, [installPromptEvent]);

  const handleDismissClick = useCallback(() => {
    setShowInstallBanner(false);
  }, []);

  return { showInstallBanner, handleInstallClick, handleDismissClick };
};
