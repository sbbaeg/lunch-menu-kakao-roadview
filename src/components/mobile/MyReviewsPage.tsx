'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating'; // StarRating 컴포넌트 경로
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 1단계 API 응답에 맞춘 타입 정의
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

export default function MyReviewsPage() {
    const showRestaurantDetail = useAppStore(state => state.showRestaurantDetail);
    const hideMyReviews = useAppStore(state => state.hideMyReviews);
    
    const [reviews, setReviews] = useState<MyReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReviews = async () => {
            try {
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
    }, []);

    const handleRestaurantClick = (kakaoPlaceId: string) => {
        // 상세 페이지로 이동
        showRestaurantDetail(kakaoPlaceId);
    };

    return (
        <div className="p-4 h-full flex flex-col bg-card">
            <header className="flex-shrink-0">
                <Button variant="ghost" onClick={hideMyReviews} className="w-fit p-0 h-auto text-muted-foreground mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    마이페이지로
                </Button>
                <h1 className="text-2xl font-bold">내가 쓴 리뷰</h1>
            </header>

            <main className="flex-1 min-h-0 overflow-y-auto mt-4">
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
            </main>
        </div>
    );
}