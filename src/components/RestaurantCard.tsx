import { useState, useEffect } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import Link from "next/link";
import { useAppStore } from '@/store/useAppStore';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';
import { RestaurantDetails } from "./RestaurantDetails";
import { Users, Utensils, ThumbsUp, ThumbsDown, Dog, ParkingSquare, Accessibility } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface RestaurantCardProps {
  restaurant: AppRestaurant;
  session: Session | null;
  subscribedTagIds: number[];
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
  onNavigate?: () => void;
}

export function RestaurantCard({
  restaurant,
  session,
  subscribedTagIds,
  onNavigate,
  ...detailProps
}: RestaurantCardProps) {
  const details = restaurant.googleDetails;
  const { isStandalone } = usePwaDisplayMode();
  const showTagDetail = useAppStore((state) => state.showTagDetail);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTagClick = (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    if (onNavigate) onNavigate();
    if (isStandalone) {
      e.preventDefault();
      showTagDetail(tagId);
    }
  };

  const totalVotes = (restaurant.likeCount ?? 0) + (restaurant.dislikeCount ?? 0);
  const likePercentage = totalVotes > 0 
    ? Math.round(((restaurant.likeCount ?? 0) / totalVotes) * 100) 
    : null;

  return (
    <AccordionItem value={restaurant.id} key={restaurant.id} className="border mb-2 shadow-sm rounded-lg overflow-hidden group transition-colors data-[state=closed]:hover:bg-accent data-[state=open]:bg-muted">
      <AccordionTrigger className="text-left hover:no-underline p-4 w-full">
        <div className="w-full flex flex-col gap-2 text-xs">
            <div className="flex flex-row items-center justify-between">
                <h3 className="text-md font-semibold">{restaurant.placeName}</h3>
                {restaurant.distance && (
                    <span className="text-xs text-gray-600 whitespace-nowrap dark:text-gray-400">
                        {restaurant.distance}m
                    </span>
                )}
            </div>
            <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>{restaurant.categoryName?.split(">").pop()?.trim()}</span>
                <div className="flex items-center gap-2">
                    {/* Like/Dislike Percentage */}
                    {likePercentage !== null && (
                      <div className="flex items-center gap-1" title="좋아요 비율">
                        {likePercentage >= 50 ? (
                          <ThumbsUp className="h-4 w-4 text-sky-500" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${likePercentage >= 50 ? 'text-sky-500' : 'text-red-500'}`}>{likePercentage}%</span>
                      </div>
                    )}
                    {/* App Rating */}
                    {restaurant.appReview && restaurant.appReview.reviewCount > 0 && (
                        <div className="flex items-center gap-1" title={`앱 평점 (${restaurant.appReview.reviewCount}개)`}>
                        <span className="text-blue-400">★</span>
                        <span>{restaurant.appReview.averageRating.toFixed(1)}</span>
                        </div>
                    )}
                    {/* Google Rating */}
                    {details?.rating && (
                        <div className="flex items-center gap-1" title="구글 평점">
                        <span className="text-yellow-400">★</span>
                        <span>{details.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground pt-1 min-h-[1.25rem]">
              {details?.allowsDogs && (
                <Tooltip><TooltipTrigger><Dog className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>반려견 동반 가능</p></TooltipContent></Tooltip>
              )}
              {details?.parkingOptions && Object.values(details.parkingOptions).some(v => v === true) && (
                <Tooltip><TooltipTrigger><ParkingSquare className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>주차 가능</p></TooltipContent></Tooltip>
              )}
              {details?.wheelchairAccessibleParking && (
                <Tooltip><TooltipTrigger><Accessibility className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>휠체어 이용 가능 주차장</p></TooltipContent></Tooltip>
              )}
              {details?.wheelchairAccessibleEntrance && (
                <Tooltip><TooltipTrigger><Accessibility className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>휠체어 이용 가능 입구</p></TooltipContent></Tooltip>
              )}
              {details?.wheelchairAccessibleRestroom && (
                <Tooltip><TooltipTrigger><Accessibility className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>휠체어 이용 가능 화장실</p></TooltipContent></Tooltip>
              )}
              {details?.wheelchairAccessibleSeating && (
                <Tooltip><TooltipTrigger><Accessibility className="h-4 w-4" /></TooltipTrigger><TooltipContent><p>휠체어 이용 가능 좌석</p></TooltipContent></Tooltip>
              )}
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-0">
        <div className="flex flex-col gap-3">
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-1">
              {isMounted && restaurant.tags?.map(tag => {
                const isMyTag = tag.creatorId === session?.user?.id;
                const isSubscribedTag = subscribedTagIds.includes(tag.id);
                const badgeVariant = isSubscribedTag ? "default" : (isMyTag ? "outline" : "secondary");
                const icon = isSubscribedTag ? "★ " : "# ";
                return (
                  <Tooltip key={tag.id}>
                    <TooltipTrigger asChild>
                      <Link href={`/tags/${tag.id}`} onClick={(e) => handleTagClick(e, tag.id)}>
                        <Badge variant={badgeVariant} className="flex items-center">
                          {icon}{tag.name}
                        </Badge>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="p-2">
                      <div className="flex flex-col gap-2">
                        <p>by {tag.creatorName || '알 수 없음'}</p>
                        {(tag.restaurantCount !== undefined && tag.subscriberCount !== undefined) && (
                          <div className="flex items-center gap-4 text-xs border-t pt-2">
                            <div className="flex items-center gap-1"><Utensils className="h-3 w-3" /> {tag.restaurantCount}</div>
                            <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {tag.subscriberCount}</div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          <div className="border-t -mx-4 px-4 pt-4 mt-1">
            <RestaurantDetails 
              restaurant={restaurant} 
              session={session} 
              onNavigate={onNavigate} 
              {...detailProps}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
