// src/components/RestaurantInfoPanel.tsx
"use client";

import { AppRestaurant, GoogleOpeningHours } from "@/lib/types";
import { Session } from "next-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { StarRating } from "./ui/StarRating";

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
    if (!openingHours?.weekday_text) return null;
    const today = new Date().getDay();
    const googleApiIndex = (today + 6) % 7;
    const todaysHours = openingHours.weekday_text[googleApiIndex];
    return todaysHours ? todaysHours.substring(todaysHours.indexOf(":") + 2) : "정보 없음";
};

interface RestaurantInfoPanelProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantInfoPanel(props: RestaurantInfoPanelProps) {
  const { restaurant } = props;
  const details = restaurant.googleDetails;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">상세 정보</h2>
      </div>
      <div className="flex justify-start">
        <RestaurantActionButtons {...props} showTextLabels={true} />
      </div>

      <div className="space-y-4">
        <div>
            <p className="text-sm font-semibold text-muted-foreground">카테고리</p>
            <p>{restaurant.categoryName}</p>
        </div>
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground">태그</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {restaurant.tags.map(tag => (
                <span key={tag.id} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">#{tag.name}</span>
              ))}
            </div>
          </div>
        )}

        {(details?.rating || (restaurant.appReview && restaurant.appReview.reviewCount > 0)) && (
            <div className="flex space-x-8">
                {details?.rating && 
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">구글 별점</p>
                        <StarRating rating={details.rating} reviewCount={details.reviews?.length || 0} />
                    </div>
                }
                {restaurant.appReview && restaurant.appReview.reviewCount > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">앱 별점</p>
                        <StarRating rating={restaurant.appReview.averageRating} reviewCount={restaurant.appReview.reviewCount} />
                    </div>
                )}
            </div>
        )}

        <div>
            <p className="text-sm font-semibold text-muted-foreground">주소</p>
            <p>{restaurant.address}</p>
        </div>

        {details?.photos && details.photos.length > 0 && (
            <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">사진</p>
                <Carousel className="w-full max-w-md">
                    <CarouselContent>
                    {details.photos.map((photoUrl, index) => (
                        <CarouselItem key={index}>
                        <Dialog>
                            <DialogTrigger asChild>
                              <button className="w-full focus:outline-none relative aspect-video">
                                <Image src={photoUrl} alt={`${restaurant.placeName} photo ${index + 1}`} fill className="object-cover rounded-md" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[90vh] p-2">
                            <Image src={photoUrl} alt={`${restaurant.placeName} photo ${index + 1}`} fill style={{ objectFit: "contain" }} />
                            </DialogContent>
                        </Dialog>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-2" />
                    <CarouselNext className="-right-2" />
                </Carousel>
            </div>
        )}

        {details?.opening_hours && (
            <div>
                <p className="text-sm font-semibold text-muted-foreground">영업</p>
                <p><span className={details.opening_hours.open_now ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{details.opening_hours.open_now ? "영업 중" : "영업 종료"}</span></p>
                <p className="text-xs text-gray-500 ml-1">(오늘: {getTodaysOpeningHours(details.opening_hours)})</p>
            </div>
        )}

        {details?.phone && 
            <div>
                <p className="text-sm font-semibold text-muted-foreground">전화</p>
                <a href={`tel:${details.phone}`} className="text-blue-600 hover:underline">{details.phone}</a>
            </div>
        }
      </div>

      <div className="flex gap-2 pt-4">
        <a href={restaurant.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button size="sm" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold flex items-center justify-center">
            <span className="flex items-center justify-center">
                <Image src="/kakaomap_icon.png" alt="카카오맵 로고" width={16} height={16} className="mr-2" />
                카카오맵
            </span>
          </Button>
        </a>
        {details?.url && (
          <a href={details.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-bold flex items-center justify-center">
                <span className="flex items-center justify-center">
                    <Image src="/googlemap_icon.png" alt="구글맵 로고" width={16} height={16} className="mr-2" />
                    구글맵
                </span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
