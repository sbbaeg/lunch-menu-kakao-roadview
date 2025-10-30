
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { Restaurant } from '@prisma/client';

export function useLikedRestaurants() {
    const { data: session, status } = useSession();
    const [likedRestaurants, setLikedRestaurants] = useState<AppRestaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLikedRestaurants = async () => {
            if (status === 'authenticated') {
                setIsLoading(true);
                try {
                    // 1. 기본 "좋아요" 목록 가져오기 (DB Restaurant 모델 반환)
                    const response = await fetch('/api/users/me/liked-restaurants');
                    if (!response.ok) {
                        throw new Error('Failed to fetch liked restaurants list');
                    }
                    const basicRestaurants: Restaurant[] = await response.json();

                    // 2. 각 음식점의 전체 정보 (googleDetails 포함)를 가져오기
                    const detailedRestaurants = await Promise.all(
                        basicRestaurants.map(r => 
                            fetch(`/api/restaurants/${r.kakaoPlaceId}`).then(res => { // BUG FIX: r.id -> r.kakaoPlaceId
                                if (!res.ok) return null; // 실패한 경우 null 반환
                                return res.json();
                            })
                        )
                    );

                    // null이 아닌 AppRestaurant 정보만 필터링하여 상태 업데이트
                    const fullRestaurants = detailedRestaurants.filter(Boolean) as AppRestaurant[];
                    setLikedRestaurants(fullRestaurants);

                } catch (error) {
                    console.error('Error loading liked restaurants:', error);
                    setLikedRestaurants([]); // 오류 발생 시 목록 비우기
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadLikedRestaurants();

    }, [status]);

    return { likedRestaurants, isLoading };
}
