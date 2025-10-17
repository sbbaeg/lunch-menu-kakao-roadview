import {
  Accordion,  AccordionContent,  AccordionItem,  AccordionTrigger,} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Carousel,  CarouselContent,  CarouselItem,  CarouselNext,  CarouselPrevious,} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AppRestaurant, GoogleOpeningHours } from "@/lib/types";
import { Session } from "next-auth";
import { EyeOff, Heart, Tags, ChevronDown, Loader2 } from "lucide-react"; // Loader2 아이콘 추가
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // useRouter 추가
import { useState } from 'react'; // useState 추가

const StarRating = ({ rating, reviewCount, isTrigger = false }: { rating: number, reviewCount?: number, isTrigger?: boolean }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className={`flex items-center ${isTrigger ? 'cursor-pointer' : ''}`}>
            {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="text-yellow-400 text-lg">★</span>)}
            {halfStar && <span className="text-yellow-400 text-lg">☆</span>}
            {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="text-gray-300 text-lg">☆</span>)}
            <span className="ml-2 text-sm font-bold">{rating.toFixed(1)}</span>
            {isTrigger && reviewCount !== undefined && (
                <div className="ml-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>리뷰 ({reviewCount}개)</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                </div>
            )}
        </div>
    );
};

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
    if (!openingHours?.weekday_text) return null;
    const today = new Date().getDay();
    const googleApiIndex = (today + 6) % 7;
    const todaysHours = openingHours.weekday_text[googleApiIndex];
    return todaysHours ? todaysHours.substring(todaysHours.indexOf(":") + 2) : "정보 없음";
};

interface RestaurantDetailsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
}

export function RestaurantDetails({
  restaurant,
  session,
  isFavorite,
  isBlacklisted,
  onToggleFavorite,
  onToggleBlacklist,
  onTagManagement,
}: RestaurantDetailsProps) {
  const details = restaurant.googleDetails;
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleViewDetails = async () => {
    setIsNavigating(true);
    try {
      // 1. 식당 정보를 DB에 저장/업데이트 요청
      await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurant),
      });

      // 2. 성공 시 상세 페이지로 이동
      router.push(`/restaurants/${restaurant.id}`);
    } catch (error) {
      console.error("Failed to navigate to details page:", error);
      alert("상세 페이지로 이동하는 데 실패했습니다.");
      setIsNavigating(false);
    }
    // 페이지 이동이 시작되면 이 컴포넌트는 사라지므로, setIsNavigating(false)는 에러 시에만 필요합니다.
  };

  return (
    <div
      className="px-4 pb-4 text-sm space-y-3 border-t"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-500">
          {restaurant.categoryName?.split('>').pop()?.trim()}
        </p>
        <div className="flex items-center">
          {session?.user && onTagManagement && onToggleBlacklist && onToggleFavorite && isBlacklisted && isFavorite && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTagManagement(restaurant)} title="태그 관리">
                <Tags className="text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleBlacklist(restaurant)} title={isBlacklisted(restaurant.id) ? "블랙리스트에서 제거" : "블랙리스트에 추가"}>
                <EyeOff className={isBlacklisted(restaurant.id) ? "fill-foreground" : "text-gray-400"} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleFavorite(restaurant)} title={isFavorite(restaurant.id) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}>
                <Heart className={isFavorite(restaurant.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
              </Button>
            </>
          )}
        </div>
      </div>

      {!details && <p className="text-gray-500">Google에서 추가 정보를 찾지 못했습니다.</p>}
      
      {details?.rating && (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="reviews" className="border-none">
                <AccordionTrigger className="hover:no-underline py-1">
                    <StarRating rating={details.rating} reviewCount={details.reviews?.length || 0} isTrigger={true} />
                </AccordionTrigger>
                <AccordionContent>
                    <div className="max-h-[300px] overflow-y-auto pr-2">
                        {details?.reviews && details.reviews.length > 0 ? (
                            details.reviews.map((review, index) => (
                                <div key={index} className="border-b py-4">
                                    <div className="flex items-center mb-2">
                                        <Image src={review.profile_photo_url} alt={review.author_name} width={40} height={40} className="rounded-full mr-3" />
                                        <div>
                                            <p className="font-semibold">{review.author_name}</p>
                                            <p className="text-xs text-gray-500">{review.relative_time_description}</p>
                                        </div>
                                    </div>
                                    <div><StarRating rating={review.rating} /></div>
                                    <p className="mt-2 text-sm">{review.text}</p>
                                </div>
                            ))
                        ) : <p className="py-4 text-center text-gray-500">표시할 리뷰가 없습니다.</p>}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      )}

      {details?.opening_hours && (
        <div className="flex flex-col">
          <p><strong>영업:</strong> <span className={details.opening_hours.open_now ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{details.opening_hours.open_now ? "영업 중" : "영업 종료"}</span></p>
          <p className="text-xs text-gray-500 ml-1">(오늘: {getTodaysOpeningHours(details.opening_hours)})</p>
        </div>
      )}

      {details?.phone && <p><strong>전화:</strong> <a href={`tel:${details.phone}`} className="text-blue-600 hover:underline">{details.phone}</a></p>}

      {details?.photos && details.photos.length > 0 && (
        <div>
          <strong>사진:</strong>
          <Carousel className="w-full max-w-xs mx-auto mt-2">
            <CarouselContent>
              {details.photos.map((photoUrl, index) => (
                <CarouselItem key={index}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full focus:outline-none">
                        <Image src={photoUrl} alt={`${restaurant.placeName} photo ${index + 1}`} width={400} height={225} className="object-cover aspect-video rounded-md" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] p-2">
                      <Image src={photoUrl} alt={`${restaurant.placeName} photo ${index + 1}`} fill style={{ objectFit: "contain" }} />
                    </DialogContent>
                  </Dialog>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      )}

      {/* Link를 Button onClick 핸들러로 변경 */}
      <div className="pt-2">
        <Button size="sm" className="w-full font-bold" onClick={handleViewDetails} disabled={isNavigating}>
          {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          상세보기
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <a href={restaurant.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button size="sm" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold flex items-center justify-center">
            <Image src="/kakaomap_icon.png" alt="카카오맵 로고" width={16} height={16} className="mr-2" />
            카카오맵
          </Button>
        </a>
        {details?.url && (
          <a href={details.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-bold flex items-center justify-center">
              <Image src="/googlemap_icon.png" alt="구글맵 로고" width={16} height={16} className="mr-2" />
              구글맵
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}