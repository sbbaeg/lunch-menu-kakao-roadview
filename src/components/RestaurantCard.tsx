import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Restaurant } from "@/lib/types";
import { Session } from "next-auth";
import Link from "next/link";
import { RestaurantDetails } from "./RestaurantDetails"; // 방금 만든 컴포넌트 import

interface RestaurantCardProps {
  restaurant: Restaurant;
  session: Session | null;
  subscribedTagIds: number[];
  isFavorite: (id: string) => boolean;
  isBlacklisted: (id: string) => boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onToggleBlacklist: (restaurant: Restaurant) => void;
  onTagManagement: (restaurant: Restaurant) => void;
}

export function RestaurantCard({
  restaurant,
  session,
  subscribedTagIds,
  ...detailProps // RestaurantDetails에 전달할 나머지 props
}: RestaurantCardProps) {
  const details = restaurant.googleDetails;

  return (
    <AccordionItem value={restaurant.id} key={restaurant.id} className="border-none group">
      <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
        <AccordionTrigger className="text-left hover:no-underline p-0 [&_svg]:hidden">
          <div className="w-full">
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-md">{restaurant.placeName}</CardTitle>
              <span className="text-xs text-gray-600 whitespace-nowrap dark:text-gray-400">
                {restaurant.distance}m
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-xs flex flex-col items-start gap-2">
              <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>{restaurant.categoryName?.split(">").pop()?.trim()}</span>
                {details?.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span>{details.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {restaurant.tags?.map(tag => {
                  const isMyTag = tag.creatorId === session?.user?.id;
                  const isSubscribedTag = subscribedTagIds.includes(tag.id);
                  const badgeVariant = isSubscribedTag ? "default" : (isMyTag ? "outline" : "secondary");
                  const icon = isSubscribedTag ? "★ " : "# ";

                  return (
                    <Link key={tag.id} href={`/tags/${tag.id}`}>
                      <Badge variant={badgeVariant} className="flex items-center">
                        {icon}{tag.name}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
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