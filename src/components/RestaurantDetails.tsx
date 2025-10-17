// src/components/RestaurantDetails.tsx
"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from "lucide-react";
import { RestaurantActionButtons } from "./RestaurantActionButtons"; // 방금 만든 컴포넌트
import { StarRating } from "./ui/StarRating"; // 방금 만든 컴포넌트
import { RestaurantPreviewContent } from "./RestaurantPreviewContent"; // 새로 만들 프리뷰 콘텐츠 컴포넌트

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
  const { restaurant, session } = props;
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

      {/* 핵심 미리보기 정보 */}
      <RestaurantPreviewContent restaurant={restaurant} />

      {/* 상세보기 버튼 */}
      <div className="pt-2">
        <Button size="sm" className="w-full font-bold" onClick={handleViewDetails} disabled={isNavigating}>
          {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          상세보기
        </Button>
      </div>
    </div>
  );
}
