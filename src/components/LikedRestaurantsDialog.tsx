
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion } from "@/components/ui/accordion";
import { AppRestaurant } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard";
import { Session } from "next-auth";
import { Skeleton } from './ui/skeleton';

// FavoritesDialogProps와 유사한 props를 받지만, 자체적으로 데이터를 fetch합니다.
interface LikedRestaurantsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  likedRestaurants: AppRestaurant[]; // 1. Prop으로 받기
  isLoading: boolean; // 1. Prop으로 받기
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

export function LikedRestaurantsDialog({
  isOpen,
  onOpenChange,
  likedRestaurants,
  isLoading,
  selectedItemId,
  setSelectedItemId,
  onNavigate,
  ...cardProps
}: LikedRestaurantsDialogProps) {

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (likedRestaurants.length > 0) {
      return (
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={selectedItemId}
          onValueChange={setSelectedItemId}
        >
          {likedRestaurants.map((place) => (
            <RestaurantCard
              key={place.id}
              restaurant={place}
              onNavigate={onNavigate}
              {...cardProps}
            />
          ))}
        </Accordion>
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <p>좋아요를 표시한 음식점이 없습니다.</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">좋아요한 음식점</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
