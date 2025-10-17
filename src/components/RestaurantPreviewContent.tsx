// src/components/RestaurantPreviewContent.tsx (테스트 4단계)
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppRestaurant } from "@/lib/types";
import Image from "next/image";
import { StarRating } from "./ui/StarRating";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface RestaurantPreviewContentProps {
    restaurant: AppRestaurant;
}

export function RestaurantPreviewContent({ restaurant }: RestaurantPreviewContentProps) {
    const details = restaurant.googleDetails;

    return (
        <div className="space-y-3">
            {/* 이전 테스트에서 통과한 리뷰 아코디언 */}
            {details?.rating && (
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="reviews" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-1">
                            <StarRating rating={details.rating} reviewCount={details.reviews?.length || 0} isTrigger={true} />
                        </AccordionTrigger>
                        <AccordionContent>
                            <p>리뷰 내용이 여기에 표시됩니다.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}

            {/* 문제의 원인으로 의심되는 사진 캐러셀 */}
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
        </div>
    );
}