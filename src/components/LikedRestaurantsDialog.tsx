
import { useState, useEffect } from 'react';
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
  selectedItemId,
  setSelectedItemId,
  onNavigate,
  ...cardProps
}: LikedRestaurantsDialogProps) {
  const [likedRestaurants, setLikedRestaurants] = useState<AppRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchLikedRestaurants = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/users/me/liked-restaurants');
          if (!response.ok) {
            throw new Error('좋아요한 음식점 목록을 불러오는 데 실패했습니다.');
          }
          const data = await response.json();
          setLikedRestaurants(data);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLikedRestaurants();
    }
  }, [isOpen]);

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

    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">좋아요한 음식점</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
