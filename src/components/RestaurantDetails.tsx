// src/components/RestaurantDetails.tsx (테스트용 임시 코드)
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";

// 실제 props 타입은 유지하여 다른 파일과의 연결을 끊지 않습니다.
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
    <div className="px-4 pb-4 text-sm border-t">
      <p className="py-4">디버깅 테스트 중입니다...</p>
    </div>
  );
}