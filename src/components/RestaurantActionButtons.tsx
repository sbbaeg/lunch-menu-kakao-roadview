// src/components/RestaurantActionButtons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { EyeOff, Heart, Tags } from "lucide-react";

interface RestaurantActionButtonsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantActionButtons({ 
    restaurant, session, isFavorite, isBlacklisted, onToggleFavorite, onToggleBlacklist, onTagManagement 
}: RestaurantActionButtonsProps) {
  if (!session?.user || !onTagManagement || !onToggleBlacklist || !onToggleFavorite || !isBlacklisted || !isFavorite) {
    return null; // 필요한 props가 없으면 렌더링하지 않음
  }

  return (
    <div className="flex items-center">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTagManagement(restaurant)} title="태그 관리">
            <Tags className="text-gray-400" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleBlacklist(restaurant)} title={isBlacklisted(restaurant.id) ? "블랙리스트에서 제거" : "블랙리스트에 추가"}>
            <EyeOff className={isBlacklisted(restaurant.id) ? "fill-foreground" : "text-gray-400"} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleFavorite(restaurant)} title={isFavorite(restaurant.id) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}>
            <Heart className={isFavorite(restaurant.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
        </Button>
    </div>
  );
}