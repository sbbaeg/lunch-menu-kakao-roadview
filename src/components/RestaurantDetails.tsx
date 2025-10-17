// src/components/RestaurantDetails.tsx (테스트 3단계)
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent"; // 테스트용 컴포넌트 import

interface RestaurantDetailsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantDetails(props: RestaurantDetailsProps) {
  const { restaurant } = props;
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleViewDetails = async () => {
    setIsNavigating(true);
    try {
      await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });
      router.push(`/restaurants/${restaurant.id}`);
    } catch (error) {
      console.error("Failed to navigate to details page:", error);
      alert("상세 페이지로 이동하는 데 실패했습니다.");
      setIsNavigating(false);
    }
  };

  return (
    <div
      className="px-4 pb-4 text-sm space-y-3 border-t"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-500">
          {restaurant.categoryName?.split('>').pop()?.trim()}
        </p>
        <RestaurantActionButtons {...props} />
      </div>

      {/* 테스트용 RestaurantPreviewContent 렌더링 */}
      <RestaurantPreviewContent restaurant={restaurant} />

      <div className="pt-2">
        <Button size="sm" className="w-full font-bold" onClick={handleViewDetails} disabled={isNavigating}>
          <span className="flex items-center justify-center">
            {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            상세보기
          </span>
        </Button>
      </div>
    </div>
  );
}