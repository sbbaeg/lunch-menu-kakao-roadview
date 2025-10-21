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
import { RestaurantDetails } from "./RestaurantDetails";

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
}

export function RestaurantCard({
  restaurant,
  session,
  subscribedTagIds,
  ...detailProps
}: RestaurantCardProps) {
  const details = restaurant.googleDetails;
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <AccordionItem value={restaurant.id} key={restaurant.id} className="border-none group">
      <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
        <AccordionTrigger className="text-left hover:no-underline p-0 [&_svg]:hidden">
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
                          <Link href={`/tags/${tag.id}`} onClick={(e) => e.stopPropagation()}>
                            <Badge variant={badgeVariant} className="flex items-center">
                              {icon}{tag.name}
                            </Badge>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>by {tag.creatorName || '알 수 없음'}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

            </CardContent>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <RestaurantDetails restaurant={restaurant} session={session} {...detailProps} />
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}