"use client";

import { usePathname } from 'next/navigation';
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import MobileLayout from "./mobile/MobileLayout";
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';

// This component manages the global font size based on user settings
function FontSizeManager() {
  const fontSize = useAppStore((state) => state.fontSize);

  useEffect(() => {
    const root = document.documentElement;
    switch (fontSize) {
      case 'small':
        root.style.fontSize = '90%';
        break;
      case 'large':
        root.style.fontSize = '110%';
        break;
      case 'xlarge':
        root.style.fontSize = '120%';
        break;
      case 'normal':
      default:
        root.style.fontSize = '100%';
        break;
    }
  }, [fontSize]);

  return null; // This component does not render anything visible
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isStandalone } = usePwaDisplayMode();

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      <FontSizeManager />
      {isAdminPage ? children : (isStandalone ? <MobileLayout /> : children)}
    </>
  );
}
