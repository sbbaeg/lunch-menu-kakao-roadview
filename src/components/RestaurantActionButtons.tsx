// src/components/RestaurantActionButtons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { EyeOff, Heart, Tags } from "lucide-react";

interface RestaurantActionButtonsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  showTextLabels?: boolean; // prop to control text visibility
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantActionButtons({ 
    restaurant, session, showTextLabels = false, isFavorite, isBlacklisted, onToggleFavorite, onToggleBlacklist, onTagManagement 
}: RestaurantActionButtonsProps) {
  if (!session?.user || !onTagManagement || !onToggleBlacklist || !onToggleFavorite || !isBlacklisted || !isFavorite) {
    return null; // 필요한 props가 없으면 렌더링하지 않음
  }

  const buttonSizeClass = showTextLabels ? "px-3 py-1 h-auto" : "h-8 w-8";
  const iconMarginClass = showTextLabels ? "mr-2" : "";

  return (
    <div className="flex items-center gap-1">
        <Button variant="ghost" size={showTextLabels ? "default" : "icon"} className={buttonSizeClass} onClick={() => onTagManagement(restaurant)} title="태그 관리">
            <Tags className={`h-5 w-5 text-gray-400 ${iconMarginClass}`} />
            {showTextLabels && <span>태그</span>}
        </Button>
        <Button variant="ghost" size={showTextLabels ? "default" : "icon"} className={buttonSizeClass} onClick={() => onToggleBlacklist(restaurant)} title={isBlacklisted(restaurant.id) ? "블랙리스트에서 제거" : "블랙리스트에 추가"}>
            <EyeOff className={`h-5 w-5 ${isBlacklisted(restaurant.id) ? "fill-foreground" : "text-gray-400"} ${iconMarginClass}`} />
            {showTextLabels && <span>블랙리스트</span>}
        </Button>
        <Button variant="ghost" size={showTextLabels ? "default" : "icon"} className={buttonSizeClass} onClick={() => onToggleFavorite(restaurant)} title={isFavorite(restaurant.id) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}>
            <Heart className={`h-5 w-5 ${isFavorite(restaurant.id) ? "fill-red-500 text-red-500" : "text-gray-400"} ${iconMarginClass}`} />
            {showTextLabels && <span>즐겨찾기</span>}
        </Button>
    </div>
  );
}