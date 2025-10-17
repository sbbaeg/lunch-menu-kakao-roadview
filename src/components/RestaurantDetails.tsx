// src/components/RestaurantDetails.tsx (테스트 2단계)
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { RestaurantActionButtons } from "./RestaurantActionButtons"; // ActionButtons만 복원

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
  return (
    <div
      className="px-4 pb-4 text-sm space-y-3 border-t"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-500">
          {props.restaurant.categoryName?.split('>').pop()?.trim()}
        </p>
        <RestaurantActionButtons {...props} />
      </div>
      <p>Action Buttons 복원 완료. 오류가 발생하지 않으면 다음 테스트를 진행합니다.</p>
    </div>
  );
}
