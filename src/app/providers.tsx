'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const setIsMapReady = useAppStore((state) => state.setIsMapReady);

  // 카카오맵 스크립트를 로드하는 useEffect
  useEffect(() => {
    const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_JS_KEY;
    if (!KAKAO_JS_KEY) {
      console.error("Kakao Maps JS key is not set.");
      return;
    }

    const scriptId = "kakao-maps-script";
    if (document.getElementById(scriptId)) {
        // 스크립트가 이미 로드되었거나 로딩 중인 경우
        // 로드 완료를 보장하기 위해 window.kakao.maps.load를 다시 호출할 수 있지만,
        // 여기서는 MobileLayout에서 이미 처리하고 있으므로 중복 로직을 피하기 위해 상태만 업데이트 할 수 있습니다.
        // 하지만 가장 확실한 방법은 여기서 로드 상태를 책임지는 것입니다.
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => setIsMapReady(true));
        }
        return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
        window.kakao.maps.load(() => {
            setIsMapReady(true);
        });
    };

    script.onerror = () => {
        console.error("Failed to load the Kakao Maps script.");
    };
  }, [setIsMapReady]);

  return <SessionProvider>{children}</SessionProvider>
}