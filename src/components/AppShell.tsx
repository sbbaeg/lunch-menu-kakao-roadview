"use client";

import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";

// 모바일 전용 UI를 위한 임시 플레이스홀더 컴포넌트입니다.
function MobileUI() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
      <h1 className="text-2xl font-bold">모바일 앱 전용 UI</h1>
      <p className="absolute bottom-4 text-sm text-gray-400">이 화면은 앱으로 접속했을 때만 보입니다.</p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isStandalone } = usePwaDisplayMode();

  // PWA가 독립 실행 모드일 경우 모바일 UI를 렌더링합니다.
  if (isStandalone) {
    return <MobileUI />;
  }

  // 그 외의 경우 (일반 브라우저) 기존 UI를 렌더링합니다.
  return <>{children}</>;
}
