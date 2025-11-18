// src/components/RestaurantDetails.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent";
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner"; // Corrected import
import { Button } from "@/components/ui/button";

interface RestaurantDetailsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
  hideViewDetailsButton?: boolean;
  onNavigate?: () => void;
}

export function RestaurantDetails(props: RestaurantDetailsProps) {
  const {
    restaurant,
  } = props;

  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { isStandalone } = usePwaDisplayMode();
  const showRestaurantDetail = useAppStore((state) => state.showRestaurantDetail);

  const handleViewDetails = async () => {
    setIsNavigating(true);
    try {
      await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });

      if (props.onNavigate) props.onNavigate();

      if (isStandalone) {
        showRestaurantDetail(restaurant.id);
      } else {
        router.push(`/restaurants/${restaurant.id}`);
      }
    } catch (error) {
      console.error("Failed to navigate to details page:", error);
      toast.error("상세 페이지로 이동하는 데 실패했습니다."); // Corrected toast call
      setIsNavigating(false);
    }
  };

  const handleKakaoDirections = () => {
    if (!restaurant.y || !restaurant.x) {
      toast.error("식당 좌표 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }

    const destinationLat = restaurant.y;
    const destinationLng = restaurant.x;
    const destinationName = restaurant.placeName; // No need to encode for this URL format

    // 카카오맵 앱 URL 스킴 (길찾기 바로 실행)
    const appUrl = `kakaomap://route?ep=${destinationLat},${destinationLng}&by=CAR`;
    
    // 카카오맵 웹 URL (정확한 장소 위치 표시)
    const webUrl = `https://map.kakao.com/link/map/${destinationName},${destinationLat},${destinationLng}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // 앱 실행을 시도하고, 2초 후에도 페이지가 활성 상태이면 웹으로 리디렉션
      const openApp = () => {
        const check = new Date().getTime();
        setTimeout(() => {
          const now = new Date().getTime();
          // 사용자가 앱으로 전환되었다면 페이지는 비활성화 상태가 됨
          // 2.5초 이상 지연되었다면 앱이 열렸다고 간주
          if (now - check < 2500 && !document.hidden) {
            window.location.href = webUrl;
          }
        }, 2000);
        window.location.href = appUrl;
      };
      openApp();
    } else {
      // 데스크톱 환경에서는 바로 웹 URL 열기
      window.open(webUrl, '_blank');
    }
  };

  return (
    <div
      className="px-4 pb-4 text-sm space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 기존 카테고리 및 액션 버튼 (변경 없음) */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-500">
          {restaurant.categoryName?.split('>').pop()?.trim()}
        </p>
        {props.session?.user &&
          props.isFavorite &&
          props.isBlacklisted &&
          props.onToggleFavorite &&
          props.onToggleBlacklist &&
          props.onTagManagement && <RestaurantActionButtons {...props} />}
      </div>

      {/* 카카오맵 길찾기 버튼 추가 */}
      <Button 
        variant="outline" 
        className="w-full mt-2" 
        onClick={handleKakaoDirections}
      >
        카카오맵으로 길찾기
      </Button>

      <RestaurantPreviewContent
        restaurant={restaurant}
        isNavigating={isNavigating}
        onViewDetails={handleViewDetails}
        showViewDetailsButton={!props.hideViewDetailsButton}
      />
    </div>
  );
}