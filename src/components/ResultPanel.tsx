import { Card, CardContent } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { RestaurantCard } from "./RestaurantCard";
import { useAppStore } from "@/store/useAppStore"; // zustand 스토어 import
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode"; // PWA 모드 감지 훅

interface ResultPanelProps {
  isLoading: boolean;
  restaurants: AppRestaurant[];
  blacklistExcludedCount: number;
  displayedSortOrder: "accuracy" | "distance" | "rating";
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
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
  ...cardProps // session, onToggleFavorite 등 RestaurantCard에 필요한 나머지 props
}: ResultPanelProps) {

  const toggleResultPanel = useAppStore((state) => state.toggleResultPanel);
  const { isStandalone } = usePwaDisplayMode(); // PWA 모드 확인

  // 핸들러 UI를 조건부로 렌더링
  const expansionHandler = isStandalone ? (
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-6 flex items-center justify-center cursor-pointer z-10"
      onClick={toggleResultPanel}
    >
      <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </div>
  ) : null;

  if (isLoading) {
    return (
      <Card className="w-full flex flex-col flex-1 min-h-0 relative"> {/* relative 추가 */}
        {expansionHandler}
        <div className="w-full flex-1 flex flex-col min-h-0 pt-4"> {/* pt-4 추가 */}
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
      <div className="w-full flex-1 flex flex-col min-h-0 pt-4"> {/* pt-4 추가 */}
        {blacklistExcludedCount > 0 && (
          <div className="p-2 mx-4 mt-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm text-center">
            <p>블랙리스트에 포함된 {blacklistExcludedCount}개의 장소가 결과에서 제외되었습니다.</p>
          </div>
        )}
        <p className="text-sm font-semibold text-gray-600 px-4">
          {getSortTitle(displayedSortOrder)}: {restaurants.length}개
        </p>
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