
"use client";

import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';

export default function PwaInstallBanner() {
  const { showInstallBanner, handleInstallClick, handleDismissClick } = usePwaInstall();

  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-md animate-in slide-in-from-top-4">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/icon.png" alt="App Icon" width={28} height={28} className="rounded-md" />
          <div>
            <p className="font-semibold">앱으로 더 편리하게 이용하세요!</p>
            <p className="text-sm text-muted-foreground">홈 화면에 추가하고 빠르게 접속할 수 있습니다.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInstallClick} size="sm">
            설치
          </Button>
          <Button onClick={handleDismissClick} size="icon" variant="ghost" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
