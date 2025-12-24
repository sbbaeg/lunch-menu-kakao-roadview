// src/components/RestaurantInfoPanel.tsx
"use client";
import { useState, useEffect } from 'react';
import { AppRestaurant, GoogleOpeningHours } from "@/lib/types";
import { Session } from "next-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { StarRating } from "./ui/StarRating";
import { ThumbsUp, ThumbsDown, Map, Globe, Share2 } from 'lucide-react';
import { toast } from "sonner";
import { VoteType } from '@prisma/client';
import { useAppStore } from '@/store/useAppStore';

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
    if (!openingHours?.weekdayDescriptions) return null;
    const today = new Date().getDay();
    const googleApiIndex = (today + 6) % 7;
    const todaysHours = openingHours.weekdayDescriptions[googleApiIndex];
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
  likeCount?: number;
  dislikeCount?: number;
  likePercentage?: number | null;
  currentUserVote?: VoteType | null;
  onVote: (voteType: VoteType) => void;
  isVoting: boolean;
}

export function RestaurantInfoPanel(props: RestaurantInfoPanelProps) {
  const {
    restaurant,
    session,
    likeCount,
    dislikeCount,
    likePercentage,
    currentUserVote,
    onVote,
    isVoting,
  } = props;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/restaurants/${restaurant.id}`;
    const shareData: ShareData = {
      title: restaurant.placeName,
      text: `${restaurant.placeName} - ${restaurant.address}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("식당 정보가 공유되었습니다.");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.info("링크가 클립보드에 복사되었습니다.");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error("공유에 실패했습니다.");
      }
    }
  };

  const details = restaurant.googleDetails;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center gap-1">
        {props.session?.user &&
          props.isFavorite &&
          props.isBlacklisted &&
          props.onToggleFavorite &&
          props.onToggleBlacklist &&
          props.onTagManagement && (
            <RestaurantActionButtons {...props} showTextLabels={true} />
          )}
        <Button variant="ghost" className="px-3 py-1 h-auto" onClick={handleShare} title="공유하기">
          <Share2 className="h-5 w-5 text-gray-400 mr-2" />
          <span>공유</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {likePercentage != null ? (
            <>
              <div className="flex items-center gap-1" title="좋아요 비율">
                <ThumbsUp className={`h-4 w-4 ${likePercentage >= 50 ? 'text-sky-500' : 'text-red-500'}`} />
                <span className={`font-medium ${likePercentage >= 50 ? 'text-foreground' : 'text-red-500'}`}>{likePercentage}%</span>
              </div>
              <div className="flex items-center gap-1 text-xs" title="좋아요 수">
                <ThumbsUp className="h-3 w-3" /> {likeCount}
              </div>
              <div className="flex items-center gap-1 text-xs" title="싫어요 수">
                <ThumbsDown className="h-3 w-3" /> {dislikeCount}
              </div>
            </>
          ) : (
            <span className="text-xs">아직 평가가 없습니다.</span>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote('UPVOTE')}
            disabled={!session || isVoting}
            className={`gap-1 ${currentUserVote === 'UPVOTE' ? 'bg-primary/10 border-primary text-primary' : ''}`}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote('DOWNVOTE')}
            disabled={!session || isVoting}
            className={`gap-1 ${currentUserVote === 'DOWNVOTE' ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
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
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="reviews" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-1">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground text-left">구글 별점</p>
                                    <StarRating rating={details.rating} reviewCount={details.reviews?.length || 0} isTrigger={true} />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="max-h-[300px] overflow-y-auto pr-2">
                                    {details?.reviews && details.reviews.length > 0 ? (
                                        details.reviews.map((review, index) => (
                                            <div key={index} className="border-b py-4">
                                                                                                <div className="flex items-center mb-2">
                                                                                                    <img
                                                                                                      src={review.profile_photo_url || '/google_icon.png'}
                                                                                                      alt={review.author_name}
                                                                                                      width={40}
                                                                                                      height={40}
                                                                                                      className="rounded-full mr-3"
                                                                                                    />
                                                                                                    <div>
                                                                                                        <p className="font-semibold">{review.author_name}</p>
                                                                                                        <p className="text-xs text-gray-500">{review.relative_time_description}</p>
                                                                                                    </div>
                                                                                                </div>                                                <div><StarRating rating={review.rating} /></div>
                                                <p className="mt-2 text-sm">{review.text}</p>
                                            </div>
                                        ))
                                    ) : <p className="py-4 text-center text-gray-500">표시할 리뷰가 없습니다.</p>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
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
                                <Image src={`/api/google-photo/${photoUrl}`} alt={`${restaurant.placeName} photo ${index + 1}`} fill className="object-cover rounded-md" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[90vh] p-2">
                            <Image src={`/api/google-photo/${photoUrl}`} alt={`${restaurant.placeName} photo ${index + 1}`} fill style={{ objectFit: "contain" }} />
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

        {isMounted && details?.opening_hours && (
            <div>
                <p className="text-sm font-semibold text-muted-foreground">영업</p>
                <p><span className={details.opening_hours.openNow ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{details.opening_hours.openNow ? "영업 중" : "영업 종료"}</span></p>
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

      <div className="flex gap-2 pt-4 border-t">
        <a href={restaurant.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button size="sm" className="w-full font-bold flex items-center justify-center">
            <span className="flex items-center justify-center">
                <Image src="/googlemap_icon.png" alt="구글맵 로고" width={16} height={16} className="mr-2" />
                Google 지도
            </span>
          </Button>
        </a>
        {details?.url && (
          <a href={details.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-bold flex items-center justify-center">
                <span className="flex items-center justify-center">
                    <Globe className="h-4 w-4 mr-2" />
                    공식 홈페이지
                </span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
