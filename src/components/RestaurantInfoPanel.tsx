// src/components/RestaurantInfoPanel.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";

// 여기에 필요한 UI 컴포넌트들을 import 합니다.
// 예: import { Button } from "@/components/ui/button";

interface RestaurantInfoPanelProps {
  restaurant: AppRestaurant;
  // session: Session | null; // 나중에 기능 버튼 추가 시 필요
}

export function RestaurantInfoPanel({ restaurant }: RestaurantInfoPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-3">정보</h2>
        <p><strong>카테고리:</strong> {restaurant.categoryName}</p>
        <p><strong>주소:</strong> {restaurant.address}</p>
        <p><strong>구글 평점:</strong> {restaurant.googleDetails?.rating?.toFixed(1) ?? 'N/A'} / 5</p>
      </div>
      
      {restaurant.tags && restaurant.tags.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-3">태그</h2>
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map(tag => (
              <span key={tag.id} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">#{tag.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* 나중에 영업시간, 전화번호, 기능 버튼(즐겨찾기 등)이 들어올 자리 */}
    </div>
  );
}
