"use client";

import { useState, useEffect } from 'react';

export function usePwaDisplayMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // PWA가 standalone 모드로 실행 중인지 확인하는 미디어 쿼리
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    
    // 초기 상태 설정
    setIsStandalone(mediaQuery.matches);

    // 디스플레이 모드 변경 감지 리스너 (필수는 아니지만 안정성을 위해 추가)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return { isStandalone };
}
