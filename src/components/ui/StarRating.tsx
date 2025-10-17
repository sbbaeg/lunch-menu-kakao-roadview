// src/components/ui/StarRating.tsx
"use client";

import { ChevronDown } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  isTrigger?: boolean;
}

export const StarRating = ({ rating, reviewCount, isTrigger = false }: StarRatingProps) => {
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