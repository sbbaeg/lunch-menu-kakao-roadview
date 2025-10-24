'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map } from 'lucide-react';
import { RestaurantDetails } from '@/components/RestaurantDetails';
import { ReviewSection } from '@/components/ReviewSection';
import { useKakaoMap } from '@/hooks/useKakaoMap';

export default function RestaurantDetailPage() {
    const { data: session } = useSession();
    const activeRestaurantId = useAppStore(state => state.activeRestaurantId);
    const hideRestaurantDetail = useAppStore(state => state.hideRestaurantDetail);

    const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);

    const { mapContainerRef, displayMarkers, relayout, setCenter, isMapInitialized, mapInstance } = useKakaoMap();

    useEffect(() => {
        if (activeRestaurantId) {
            const fetchRestaurantData = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/restaurants/${activeRestaurantId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || '음식점 정보를 불러오는데 실패했습니다.');
                    }
                    const data = await response.json();
                    setRestaurant(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchRestaurantData();
        }
    }, [activeRestaurantId]);

    useEffect(() => {
        if (isMapVisible) {
            setTimeout(() => {
                relayout();
            }, 10); // A small delay can help
        }
    }, [isMapVisible, relayout]);

    useEffect(() => {
        if (isMapVisible && isMapInitialized && restaurant && mapInstance) {
            mapInstance.relayout();
            setCenter(Number(restaurant.y), Number(restaurant.x));
            displayMarkers([restaurant]);
        }
    }, [isMapVisible, isMapInitialized, restaurant, mapInstance, setCenter, displayMarkers]);

    if (loading) {
        return (
            <div className="p-4 h-full space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <div className="space-y-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-4 w-1/3" />
                <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                 <Button variant="ghost" onClick={hideRestaurantDetail} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={hideRestaurantDetail} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div>음식점을 찾을 수 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex-shrink-0 mb-4">
                <Button variant="ghost" onClick={hideRestaurantDetail} className="w-fit p-0 h-auto text-muted-foreground mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{restaurant.placeName}</h1>
                    <Button variant="outline" size="sm" onClick={() => setIsMapVisible(prev => !prev)}>
                        <Map className="mr-2 h-4 w-4" />
                        {isMapVisible ? '지도 숨기기' : '지도 보기'}
                    </Button>
                </div>
            </header>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMapVisible ? 'h-64 border rounded-md' : 'h-0'}`}>
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pt-4">
                <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border">
                    <RestaurantDetails 
                        restaurant={restaurant} 
                        session={session}
                        hideViewDetailsButton={true}
                    />
                </div>

                <ReviewSection restaurantId={restaurant.dbId!} />
            </div>
        </div>
    );
}
