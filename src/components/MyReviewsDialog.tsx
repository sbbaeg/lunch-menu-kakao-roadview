'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// API 응답 타입 (MyReviewsPage.tsx와 동일)
interface MyReview {
    id: number;
    rating: number;
    text: string | null;
    createdAt: string;
    restaurant: {
        id: number;
        placeName: string;
        kakaoPlaceId: string;
    };
}

interface MyReviewsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function MyReviewsDialog({ isOpen, onOpenChange }: MyReviewsDialogProps) {
    const router = useRouter();
    const [reviews, setReviews] = useState<MyReview[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog가 열릴 때만 리뷰를 불러옵니다.
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const fetchMyReviews = async () => {
                try {
                    // 1. 이미 만들어둔 API 재사용
                    const response = await fetch('/api/users/me/reviews'); 
                    if (response.ok) {
                        const data = await response.json();
                        setReviews(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch my reviews", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchMyReviews();
        }
    }, [isOpen]);

    const handleRestaurantClick = (kakaoPlaceId: string) => {
        // 4. Dialog를 닫고,
        onOpenChange(false);
        // 5. 해당 음식점의 PC 상세 페이지로 URL 이동
        router.push(`/restaurants/${kakaoPlaceId}`);
    };
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>내가 쓴 리뷰</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <p className="text-center text-muted-foreground py-16">작성한 리뷰가 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map(review => (
                                <div key={review.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{review.restaurant.placeName}</span>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-sm text-foreground/90 my-2 whitespace-pre-wrap">
                                        {review.text || "(내용 없음)"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        {format(new Date(review.createdAt), 'yyyy년 M월 d일', { locale: ko })}
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => handleRestaurantClick(review.restaurant.kakaoPlaceId)}
                                    >
                                        <Building className="h-4 w-4 mr-2" />
                                        음식점 정보 보기
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}