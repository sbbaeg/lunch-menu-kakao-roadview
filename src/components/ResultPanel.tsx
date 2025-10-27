import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { RestaurantCard } from "./RestaurantCard";
import { useAppStore } from "@/store/useAppStore"; // zustand 스토어 import
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode"; // PWA 모드 감지 훅
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface ResultPanelProps {
  isLoading: boolean;
  restaurants: AppRestaurant[];
  blacklistExcludedCount: number;
  displayedSortOrder: "accuracy" | "distance" | "rating";
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  onOpenFilter: () => void; // 필터 열기 함수 prop 추가
  // --- RestaurantCard에 전달할 Props ---
  session: Session | null;
  subscribedTagIds: number[];
  isFavorite: (id: string) => boolean;
  isBlacklisted: (id: string) => boolean;
  onToggleFavorite: (restaurant: AppRestaurant) => void;
  onToggleBlacklist: (restaurant: AppRestaurant) => void;
  onTagManagement: (restaurant: AppRestaurant) => void;
}

const getSortTitle = (sort: "accuracy" | "distance" | "rating"): string => {
  switch (sort) {
    case "distance": return "가까운 순 결과";
    case "rating": return "별점 순 결과";
    case "accuracy":
    default: return "랜덤 추천 결과";
  }
};

export function ResultPanel({
  isLoading,
  restaurants,
  blacklistExcludedCount,
  displayedSortOrder,
  selectedItemId,
  setSelectedItemId,
  onOpenFilter,
  ...cardProps // session, onToggleFavorite 등 RestaurantCard에 필요한 나머지 props
}: ResultPanelProps) {

  const { resultPanelState, setResultPanelState } = useAppStore();
  const { isStandalone } = usePwaDisplayMode();
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchMoveY.current = e.targetTouches[0].clientY; // 초기화
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveY.current = e.targetTouches[0].clientY;
  };

  const handleDragEnd = () => {
    const touchDistance = touchStartY.current - touchMoveY.current;
    const threshold = 50; // 50px 이상 움직여야 스와이프로 간주

    if (touchDistance > threshold) { // 위로 스와이프
      if (resultPanelState === 'collapsed') setResultPanelState('default');
      else if (resultPanelState === 'default') setResultPanelState('expanded');
    } else if (touchDistance < -threshold) { // 아래로 스와이프
      if (resultPanelState === 'expanded') setResultPanelState('default');
      else if (resultPanelState === 'default') setResultPanelState('collapsed');
    } else {
      // 스와이프 거리가 짧으면 클릭으로 간주하여 순환
      if (resultPanelState === 'default') setResultPanelState('expanded');
      else if (resultPanelState === 'expanded') setResultPanelState('collapsed');
      else setResultPanelState('default');
    }
    // 값 초기화
    touchStartY.current = 0;
    touchMoveY.current = 0;
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    touchStartY.current = e.clientY;
    touchMoveY.current = e.clientY;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    handleDragEnd();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    touchMoveY.current = e.clientY;
  };

  // 핸들러 UI를 조건부로 렌더링
  const expansionHandler = isStandalone ? (
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-6 flex items-center justify-center cursor-pointer z-10"
      onClick={() => { // 클릭 이벤트 핸들러 (터치 미지원 기기용)
        if (resultPanelState === 'default') setResultPanelState('expanded');
        else if (resultPanelState === 'expanded') setResultPanelState('collapsed');
        else setResultPanelState('default');
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </div>
  ) : null;

  if (isLoading) {
    return (
      <Card className="w-full flex flex-col min-h-0 relative overflow-hidden">
        {expansionHandler}
        <div className="w-full flex-1 flex flex-col min-h-0 pt-6">
          <div className="h-full flex flex-col justify-center p-2">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="p-4 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
                <Skeleton className="h-4 w-2/5" />
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (restaurants.length === 0) {
    return (
      <Card className="w-full flex flex-col flex-1 min-h-0 relative"> {/* relative 추가 */}
        {expansionHandler}
        <div className="w-full flex-1 flex flex-col min-h-0 pt-4"> {/* pt-4 추가 */}
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">검색 결과가 여기에 표시됩니다.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col flex-1 min-h-0 relative bg-background"> {/* relative, bg-background 추가 */}
      {expansionHandler}
      <div className="w-full flex-1 flex flex-col min-h-0"> {/* pt-4 추가 */}
        {blacklistExcludedCount > 0 && (
          <div className="p-2 mx-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm text-center">
            <p>블랙리스트에 포함된 {blacklistExcludedCount}개의 장소가 결과에서 제외되었습니다.</p>
          </div>
        )}
        <div className="flex justify-between items-center px-4">
          <p className="text-sm font-semibold text-gray-600">
            {getSortTitle(displayedSortOrder)}: {restaurants.length}개
          </p>
          <Button variant="ghost" size="icon" onClick={onOpenFilter}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <CardContent className="px-2 pt-1 pb-2 thin-scrollbar overflow-y-auto flex-1">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={selectedItemId}
            onValueChange={setSelectedItemId}
          >
            {restaurants.map((place) => (
              <RestaurantCard
                key={place.id}
                restaurant={place}
                {...cardProps}
              />
            ))}
          </Accordion>
        </CardContent>
      </div>
    </Card>
  );
}