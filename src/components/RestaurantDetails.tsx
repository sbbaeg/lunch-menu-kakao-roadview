// src/components/RestaurantDetails.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent";

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
        {props.session?.user &&
          props.isFavorite &&
          props.isBlacklisted &&
          props.onToggleFavorite &&
          props.onToggleBlacklist &&
          props.onTagManagement && <RestaurantActionButtons {...props} />}
      </div>

      {/* 상세보기 버튼 관련 로직을 props로 전달 */}
      <RestaurantPreviewContent 
        restaurant={restaurant} 
        isNavigating={isNavigating}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}