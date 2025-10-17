// src/components/RestaurantPreviewContent.tsx
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppRestaurant, GoogleOpeningHours } from "@/lib/types";
import Image from "next/image";
import { StarRating } from "./ui/StarRating";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "./ui/button";

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
    if (!openingHours?.weekday_text) return null;
    const today = new Date().getDay();
    const googleApiIndex = (today + 6) % 7;
    const todaysHours = openingHours.weekday_text[googleApiIndex];
    return todaysHours ? todaysHours.substring(todaysHours.indexOf(":") + 2) : "정보 없음";
};

interface RestaurantPreviewContentProps {
    restaurant: AppRestaurant;
}

export function RestaurantPreviewContent({ restaurant }: RestaurantPreviewContentProps) {
    const details = restaurant.googleDetails;

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

            <div className="flex gap-2 pt-2">
                <a href={restaurant.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                        <span className="flex items-center justify-center">
                            <Image src="/kakaomap_icon.png" alt="카카오맵 로고" width={16} height={16} className="mr-2" />
                            카카오맵
                        </span>
                    </Button>
                </a>
                {details?.url && (
                    <a href={details.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full font-bold">
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