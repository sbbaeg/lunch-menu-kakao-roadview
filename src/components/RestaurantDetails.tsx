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
import { Car, Footprints, Bus, Share2 } from "lucide-react";

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
  const [showKakaoOptions, setShowKakaoOptions] = useState(false);
  const { isStandalone } = usePwaDisplayMode();
  const showRestaurantDetail = useAppStore((state) => state.showRestaurantDetail);

  // New state and effect to check for mobile environment
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);


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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/restaurants/${restaurant.id}`;
    const shareData: ShareData = {
      title: restaurant.placeName,
      text: `${restaurant.placeName} - ${restaurant.address}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("식당 정보가 공유되었습니다.");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.info("링크가 클립보드에 복사되었습니다.");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error("공유에 실패했습니다.");
      }
    }
  };

  // This handler is now for MOBILE ONLY
  const handleKakaoDirections = (mode: TravelMode) => {
    if (!restaurant.y || !restaurant.x) {
      toast.error("식당 좌표 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }
    
    const destinationLat = restaurant.y;
    const destinationLng = restaurant.x;

    const appUrl = `kakaomap://route?ep=${destinationLat},${destinationLng}&by=${mode.toLowerCase()}`;
    const webUrl = `https://m.map.kakao.com/scheme/route?ep=${destinationLat},${destinationLng}&by=${mode.toLowerCase()}`;
    
    // Mobile-only logic to try opening the app, with a fallback to the mobile site.
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
  };

  // New handler for PC ONLY - now async to handle coordinate conversion
  const handlePcDirections = async () => {
    if (!restaurant.y || !restaurant.x) {
      toast.error("식당 좌표 정보가 없어 길찾기를 시작할 수 없습니다.");
      return;
    }

    const toastId = toast.loading("좌표를 변환하는 중입니다...");

    try {
      // 1. Call our backend API to convert coordinates
      const transcoordResponse = await fetch('/api/transcoord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x: restaurant.x, y: restaurant.y }),
      });

      if (!transcoordResponse.ok) {
        throw new Error('좌표 변환에 실패했습니다.');
      }

      const converted = await transcoordResponse.json();

      // 2. Build the URL with the converted KATEC coordinates
      const destinationName = restaurant.placeName;
      const webUrl = `https://map.kakao.com/?eName=${encodeURIComponent(destinationName)}&eX=${converted.x}&eY=${converted.y}`;
      
      window.open(webUrl, '_blank');
      toast.success("길찾기 페이지를 열었습니다.", { id: toastId });

    } catch (error) {
      console.error("Failed to get directions for PC:", error);
      toast.error(error instanceof Error ? error.message : "길찾기 중 오류가 발생했습니다.", { id: toastId });
    }
  };

  const handleViewOnKakaoMap = async () => {
    if (!restaurant.y || !restaurant.x || !restaurant.placeName) {
      toast.error("식당 정보가 불완전하여 상세 정보를 볼 수 없습니다.");
      return;
    }

    const toastId = toast.loading("카카오맵 상세 정보 로딩 중...");

    try {
      const response = await fetch('/api/kakao-place-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          placeName: restaurant.placeName, 
          x: restaurant.x, 
          y: restaurant.y 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카카오맵 상세 정보 조회에 실패했습니다.');
      }

      const { placeUrl } = await response.json();

      if (!placeUrl) {
        throw new Error('카카오맵 상세 URL을 찾을 수 없습니다.');
      }
      
      window.open(placeUrl, '_blank');
      toast.success("카카오맵 상세 페이지를 열었습니다.", { id: toastId });

    } catch (error) {
      console.error("Failed to view details on Kakao Map:", error);
      toast.error(error instanceof Error ? error.message : "카카오맵 상세 정보 조회 중 오류가 발생했습니다.", { id: toastId });
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
        <div className="flex items-center gap-1">
          {props.session?.user &&
            props.isFavorite &&
            props.isBlacklisted &&
            props.onToggleFavorite &&
            props.onToggleBlacklist &&
            props.onTagManagement && <RestaurantActionButtons {...props} />}
          <Button variant="ghost" size="icon" onClick={handleShare} title="공유하기">
            <Share2 className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Kakao Map Actions */}
      <div>
        <Button 
          variant="outline" 
          className="w-full mt-2" 
          onClick={() => setShowKakaoOptions(!showKakaoOptions)}
        >
          카카오맵
        </Button>

        {showKakaoOptions && (
          <div className="mt-2">
            {isMobile ? (
              // Mobile View: 4 buttons
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('CAR')}>
                  <Car className="h-4 w-4 mr-1" /> 자동차
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('FOOT')}>
                  <Footprints className="h-4 w-4 mr-1" /> 도보
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleKakaoDirections('PUBLICTRANSIT')}>
                  <Bus className="h-4 w-4 mr-1" /> 교통
                </Button>
                <Button variant="outline" size="sm" onClick={handleViewOnKakaoMap}>
                  상세
                </Button>
              </div>
            ) : (
              // PC View: 2 buttons + helper text
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handlePcDirections}>
                    길찾기
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleViewOnKakaoMap}>
                    상세보기
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  웹 버전에선 출발지를 직접 입력해야 합니다.
                </p>
              </div>
            )}
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