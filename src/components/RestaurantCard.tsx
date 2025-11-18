import { useState, useEffect } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import Link from "next/link";
import { useAppStore } from '@/store/useAppStore';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';
import { RestaurantDetails } from "./RestaurantDetails";
import { DirectionsPanel } from "./DirectionsPanel";
import { Users, Utensils, ThumbsUp, ThumbsDown, Dog, ParkingSquare, Accessibility } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
  onShowDirections?: (restaurant: AppRestaurant) => void;
  showDirections?: boolean;
}

export function RestaurantCard({
  restaurant,
  session,
  subscribedTagIds,
  onNavigate, // onNavigate prop 추가
  onShowDirections,
  showDirections = false,
  ...detailProps
}: RestaurantCardProps) {
  const details = restaurant.googleDetails;
  const { isStandalone } = usePwaDisplayMode();
  const showTagDetail = useAppStore((state) => state.showTagDetail);
  const showRestaurantDetail = useAppStore((state) => state.showRestaurantDetail);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTagClick = (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(); // 네비게이트 콜백 호출
    if (isStandalone) {
      e.preventDefault();
      showTagDetail(tagId);
    }
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDirections?.(restaurant);
  };

  const totalVotes = (restaurant.likeCount ?? 0) + (restaurant.dislikeCount ?? 0);
  const likePercentage = totalVotes > 0 
    ? Math.round(((restaurant.likeCount ?? 0) / totalVotes) * 100) 
    : null; // 평가가 없으면 null

  return (
    <AccordionItem value={restaurant.id} key={restaurant.id} className="border-none group">
      <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
        <AccordionTrigger className="text-left hover:no-underline p-0 [&>svg]:hidden">
          <div className="w-full">
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-md">{restaurant.placeName}</CardTitle>
              {restaurant.distance && (
                  <span className="text-xs text-gray-600 whitespace-nowrap dark:text-gray-400">
                      {restaurant.distance}m
                  </span>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-xs flex flex-col items-start gap-2">
              <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>{restaurant.categoryName?.split(">").pop()?.trim()}</span>
                <Button variant="outline" size="sm" onClick={handleDirectionsClick}>길찾기</Button>
              </div>
              <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1" title="좋아요 비율">
                  {likePercentage !== null ? (
                    <>
                      {likePercentage >= 50 ? (
                        <ThumbsUp className="h-4 w-4 text-sky-500" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-medium ${likePercentage >= 50 ? 'text-sky-500' : 'text-red-500'}`}>{likePercentage}%</span>
                    </>
                  ) : <div />}
                </div>
                <div className="flex items-center gap-2">
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

              {/* 추가 정보 아이콘 섹션 */}
              <div className="flex items-center gap-3 text-muted-foreground pt-2">
                {restaurant.googleDetails?.allowsDogs && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Dog className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>반려견 동반 가능</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {restaurant.googleDetails?.parkingOptions && Object.values(restaurant.googleDetails.parkingOptions).some(v => v === true) && (
                  <Tooltip>
                    <TooltipTrigger>
                      <ParkingSquare className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>주차 가능</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {restaurant.googleDetails?.wheelchairAccessibleParking && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Accessibility className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>휠체어 이용 가능 주차장</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {restaurant.googleDetails?.wheelchairAccessibleEntrance && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Accessibility className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>휠체어 이용 가능 입구</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {restaurant.googleDetails?.wheelchairAccessibleRestroom && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Accessibility className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>휠체어 이용 가능 화장실</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {restaurant.googleDetails?.wheelchairAccessibleSeating && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Accessibility className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>휠체어 이용 가능 좌석</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {showDirections ? (
            <DirectionsPanel restaurant={restaurant} />
          ) : (
            <RestaurantDetails 
              restaurant={restaurant} 
              session={session} 
              onNavigate={onNavigate} 
              {...detailProps} // isFavorite, onToggleFavorite 등 전달
            />
          )}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}