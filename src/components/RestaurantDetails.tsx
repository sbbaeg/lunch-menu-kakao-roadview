// src/components/RestaurantDetails.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent";
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Bus, Loader2 } from "lucide-react";

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
  const [isConverting, setIsConverting] = useState(false);
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

  const handleKakaoDirections = async (mode: TravelMode) => {
    if (!restaurant.y || !restaurant.x) {
      toast.error("식당 좌표 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }
    
    setIsConverting(true);
    try {
      // 1. Call backend to convert coordinates
      const transcoordResponse = await fetch('/api/transcoord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: restaurant.x, lng: restaurant.y }),
      });

      if (!transcoordResponse.ok) {
        throw new Error('Coordinate conversion failed');
      }
      
      const converted = await transcoordResponse.json();
      const { lat: convertedLat, lng: convertedLng } = converted;

      // 2. Use converted coordinates to build Kakao Map URLs
      const destinationName = restaurant.placeName;
      const appUrl = `kakaomap://route?ep=${convertedLat},${convertedLng}&by=${mode}`;
      const webTarget = mode === 'PUBLICTRANSIT' ? 'traffic' : (mode === 'FOOT' ? 'walk' : 'car');
      const webUrl = `https://map.kakao.com/?eName=${encodeURIComponent(destinationName)}&eX=${convertedLng}&eY=${convertedLat}&target=${webTarget}`;
      
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

    } catch (error) {
      console.error("Failed to get directions:", error);
      toast.error("길찾기 정보를 가져오는 데 실패했습니다.");
    } finally {
      setIsConverting(false);
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
          disabled={isConverting}
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              좌표 변환 중...
            </>
          ) : (
            "카카오맵으로 길찾기"
          )}
        </Button>
        {showTravelModes && !isConverting && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('CAR')} disabled={isConverting}>
              <Car className="h-4 w-4 mr-2" /> 자동차
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('FOOT')} disabled={isConverting}>
              <Footprints className="h-4 w-4 mr-2" /> 도보
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('PUBLICTRANSIT')} disabled={isConverting}>
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