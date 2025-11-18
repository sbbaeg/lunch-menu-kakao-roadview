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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Bus } from "lucide-react";

type TravelMode = 'CAR' | 'FOOT' | 'PUBLICTRANSIT';

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
  const [showTravelModes, setShowTravelModes] = useState(false);
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
      toast.error("상세 페이지로 이동하는 데 실패했습니다.");
      setIsNavigating(false);
    }
  };

  const handleKakaoDirections = (mode: TravelMode) => {
    if (!restaurant.y || !restaurant.x) {
      toast.error("식당 좌표 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }

    // Corrected coordinate assignment
    const destinationLat = restaurant.x; // x is Latitude
    const destinationLng = restaurant.y; // y is Longitude
    const destinationName = restaurant.placeName;

    // 카카오맵 앱 URL 스킴 (ep=위도,경도)
    const appUrl = `kakaomap://route?ep=${destinationLat},${destinationLng}&by=${mode}`;
    
    // 카카오맵 웹 URL (eY=위도, eX=경도)
    const webTarget = mode === 'PUBLICTRANSIT' ? 'traffic' : (mode === 'FOOT' ? 'walk' : 'car');
    const webUrl = `https://map.kakao.com/?eName=${encodeURIComponent(destinationName)}&eX=${destinationLng}&eY=${destinationLat}&target=${webTarget}`;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const openApp = () => {
        const check = new Date().getTime();
        setTimeout(() => {
          const now = new Date().getTime();
          if (now - check < 2500 && !document.hidden) {
            window.location.href = webUrl;
          }
        }, 2000);
        window.location.href = appUrl;
      };
      openApp();
    } else {
      window.open(webUrl, '_blank');
    }
  };

  return (
    <div
      className="px-4 pb-4 text-sm space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
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

      <div>
        <Button 
          variant="outline" 
          className="w-full mt-2" 
          onClick={() => setShowTravelModes(!showTravelModes)}
        >
          카카오맵으로 길찾기
        </Button>
        {showTravelModes && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('CAR')}>
              <Car className="h-4 w-4 mr-2" /> 자동차
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('FOOT')}>
              <Footprints className="h-4 w-4 mr-2" /> 도보
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('PUBLICTRANSIT')}>
              <Bus className="h-4 w-4 mr-2" /> 대중교통
            </Button>
          </div>
        )}
      </div>

      <RestaurantPreviewContent
        restaurant={restaurant}
        isNavigating={isNavigating}
        onViewDetails={handleViewDetails}
        showViewDetailsButton={!props.hideViewDetailsButton}
      />
    </div>
  );
}