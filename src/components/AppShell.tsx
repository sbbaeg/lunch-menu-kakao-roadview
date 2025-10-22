"use client";

import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import MobileLayout from "./mobile/MobileLayout";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isStandalone } = usePwaDisplayMode();

  // PWA가 독립 실행 모드일 경우 모바일 UI를 렌더링합니다.
  if (isStandalone) {
    return <MobileLayout />;
  }

  // 그 외의 경우 (일반 브라우저) 기존 UI를 렌더링합니다.
  return <>{children}</>;
}
