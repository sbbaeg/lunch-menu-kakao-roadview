// src/components/RestaurantPreviewContent.tsx
"use client";
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppRestaurant, GoogleOpeningHours } from "@/lib/types";
import Image from "next/image";
import { StarRating } from "./ui/StarRating";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
    if (!openingHours?.weekdayDescriptions) return null;
    const today = new Date().getDay();
    // JavaScript getDay()는 일요일=0, 월요일=1, ..., 토요일=6
    // Google API weekday_text는 월요일부터 시작하므로 인덱스 조정 필요 없음 (단, 일요일이 0이므로 주의)
    // Google API의 periods.open.day는 일요일=0, 월요일=1...
    // 여기서는 weekdayDescriptions 배열을 사용하므로, 월요일이 0 인덱스.
    const googleApiIndex = (today === 0) ? 6 : today - 1; // 일요일(0) -> 6, 월요일(1) -> 0, ...
    const todaysHours = openingHours.weekdayDescriptions[googleApiIndex];
    return todaysHours ? todaysHours.substring(todaysHours.indexOf(":") + 2) : "정보 없음";
};

interface RestaurantPreviewContentProps {
    restaurant: AppRestaurant;
    isNavigating: boolean;
    onViewDetails: () => Promise<void>;
    showViewDetailsButton?: boolean;
}

export function RestaurantPreviewContent({ restaurant, isNavigating, onViewDetails, showViewDetailsButton = true }: RestaurantPreviewContentProps) {
    const details = restaurant.googleDetails;

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="space-y-3">
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

            {isMounted && details?.opening_hours && (
                <div className="flex flex-col">
                <p><strong>영업:</strong> <span className={details.opening_hours.openNow ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{details.opening_hours.openNow ? "영업 중" : "영업 종료"}</span></p>
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
                              <button className="w-full focus:outline-none relative aspect-video">
                                <Image src={photoUrl} alt={`${restaurant.placeName} photo ${index + 1}`} fill className="object-cover rounded-md" />
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

            {showViewDetailsButton && (
                <div className="pt-2 flex justify-center gap-2">
                    <Button size="sm" className="font-bold px-8" onClick={onViewDetails} disabled={isNavigating}>
                        <span className="flex items-center justify-center">
                            {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            상세보기
                        </span>
                    </Button>
                    {details?.url && (
                        <a href={details.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="font-bold px-8">
                                자사사이트
                            </Button>
                        </a>
                    )}
                </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
                <a href={restaurant.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                        <span className="flex items-center justify-center">
                            <Image src="/kakaomap_icon.png" alt="카카오맵 로고" width={16} height={16} className="mr-2" />
                            카카오맵
                        </span>
                    </Button>
                </a>
                {details?.placeId && (
                    <a href={`https://www.google.com/maps/search/?api=1&query_place_id=${details.placeId}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full font-bold">
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