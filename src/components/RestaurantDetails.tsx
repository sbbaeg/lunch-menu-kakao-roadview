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
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button"; // Button 컴포넌트 임포트

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
  const userLocation = useAppStore((state) => state.userLocation); // 사용자 위치 가져오기

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
      toast.error("상세 페이지로 이동하는 데 실패했습니다.");
      setIsNavigating(false);
    }
  };

  const handleKakaoDirections = () => {
    if (!userLocation || !restaurant.y || !restaurant.x) {
      toast.error("현재 위치 또는 식당 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }

    const originLat = userLocation.lat;
    const originLng = userLocation.lng;
    const destinationLat = restaurant.y;
    const destinationLng = restaurant.x;
    const destinationName = restaurant.placeName;

    // 카카오맵 길찾기 URL 스킴 (자동차 기준)
    // sp: 출발지, ep: 목적지, by: 이동수단 (CAR, PUBLICTRANSIT, FOOT, BICYCLE)
    const kakaoMapUrl = `kakaomap://route?sp=${originLat},${originLng}&ep=${destinationLat},${destinationLng}&by=CAR&name=${encodeURIComponent(destinationName)}`;

    window.open(kakaoMapUrl, '_blank');
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