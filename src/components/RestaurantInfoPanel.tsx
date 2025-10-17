// src/components/RestaurantInfoPanel.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent";

interface RestaurantInfoPanelProps {
  restaurant: AppRestaurant;
  session: Session | null;
  // 즐겨찾기/블랙리스트/태그 기능에 필요한 props
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantInfoPanel(props: RestaurantInfoPanelProps) {
  const { restaurant } = props;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-semibold">정보</h2>
            <p className="text-muted-foreground">{restaurant.categoryName}</p>
            <p className="text-muted-foreground">{restaurant.address}</p>
        </div>
        <RestaurantActionButtons {...props} />
      </div>
      
      {/* 미리보기 콘텐츠 재사용 */}
      <RestaurantPreviewContent restaurant={restaurant} />

    </div>
  );
}
