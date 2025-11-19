import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion } from "@/components/ui/accordion";
import { AppRestaurant } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard"; // 이미 만들어 둔 RestaurantCard를 재사용합니다!
import { Session } from "next-auth";

interface FavoritesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  favorites: AppRestaurant[];
  session: Session | null;
  subscribedTagIds: number[];
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  isFavorite: (id: string) => boolean;
  isBlacklisted: (id: string) => boolean;
  onToggleFavorite: (restaurant: AppRestaurant) => void;
  onToggleBlacklist: (restaurant: AppRestaurant) => void;
  onTagManagement: (restaurant: AppRestaurant) => void;
  onNavigate?: () => void;
}

export function FavoritesDialog({
  isOpen,
  onOpenChange,
  favorites,
  selectedItemId,
  setSelectedItemId,
  onNavigate, // onNavigate prop 추가
  ...cardProps // RestaurantCard에 전달할 나머지 props
}: FavoritesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">즐겨찾기 목록</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-4">
          {favorites.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={selectedItemId}
              onValueChange={setSelectedItemId}
            >
              {favorites.map((place) => (
                <RestaurantCard
                  key={place.id}
                  restaurant={place}
                  onNavigate={onNavigate} // onNavigate 전달
                  {...cardProps}
                />
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>즐겨찾기에 등록된 음식점이 없습니다.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}