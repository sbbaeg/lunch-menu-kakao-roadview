// src/components/RestaurantPreviewContent.tsx (테스트 3단계)
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppRestaurant } from "@/lib/types";
import { StarRating } from "./ui/StarRating";

interface RestaurantPreviewContentProps {
    restaurant: AppRestaurant;
}

export function RestaurantPreviewContent({ restaurant }: RestaurantPreviewContentProps) {
    const details = restaurant.googleDetails;

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">테스트: 리뷰 아코디언</p>
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
        </div>
    );
}