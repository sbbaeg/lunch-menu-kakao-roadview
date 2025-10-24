'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { TagHeader } from '@/components/TagHeader';
import { RestaurantCard } from '@/components/RestaurantCard';
import { AppRestaurant, Tag } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useKakaoMap } from '@/hooks/useKakaoMap';

type TagDetailData = Tag & {
    restaurants: AppRestaurant[];
    isSubscribed: boolean;
    subscriberCount: number;
    restaurantCount: number;
    creator: {
        id: string;
        name: string | null;
    };
};

export default function TagDetailPage() {
    const { data: session } = useSession();
    const activeTagId = useAppStore(state => state.activeTagId);
    const hideTagDetail = useAppStore(state => state.hideTagDetail);

    const [tagData, setTagData] = useState<TagDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [hasMapLoaded, setHasMapLoaded] = useState(false);

    const { mapContainerRef, displayMarkers, relayout, mapInstance, isMapInitialized, setCenter } = useKakaoMap();

    useEffect(() => {
        if (activeTagId) {
            const fetchTagData = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/tags/${activeTagId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || '태그 정보를 불러오는데 실패했습니다.');
                    }
                    const data = await response.json();
                    setTagData(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchTagData();
        }
    }, [activeTagId]);

    useEffect(() => {
        if (isMapVisible) {
            // A timeout gives the container time to transition its height
            setTimeout(() => {
                relayout(); 
            }, 300);
        }
    }, [isMapVisible, relayout]);

    // A separate effect to draw markers once the map is actually created.
    useEffect(() => {
        if (isMapVisible && isMapInitialized && mapInstance && tagData && tagData.restaurants.length > 0 && !hasMapLoaded) {
             mapInstance.relayout();
             displayMarkers(tagData.restaurants);
             const bounds = new window.kakao.maps.LatLngBounds();
             tagData.restaurants.forEach(r => bounds.extend(new window.kakao.maps.LatLng(Number(r.y), Number(r.x))));
             mapInstance.setBounds(bounds);
             setHasMapLoaded(true);
        }
    }, [isMapVisible, isMapInitialized, mapInstance, tagData, displayMarkers, hasMapLoaded]);

    const handleRestaurantSelect = (id: string) => {
        if (!id) return;
        const restaurant = tagData?.restaurants.find(r => r.id === id);
        if (restaurant && mapInstance) {
            setCenter(Number(restaurant.y), Number(restaurant.x));
        }
    };

    const handleSubscribe = async () => {
        if (!tagData || !session) return;

        const method = tagData.isSubscribed ? 'DELETE' : 'POST';
        try {
            const response = await fetch(`/api/tags/${activeTagId}/subscribe`, { method });
            if (!response.ok) {
                throw new Error('구독 상태 변경에 실패했습니다.');
            }
            setTagData(prevData => {
                if (!prevData) return null;
                const newIsSubscribed = !prevData.isSubscribed;
                const newSubscriberCount = newIsSubscribed
                    ? prevData.subscriberCount + 1
                    : prevData.subscriberCount - 1;

                return {
                    ...prevData,
                    isSubscribed: newIsSubscribed,
                    subscriberCount: newSubscriberCount,
                };
            });
        } catch (err: any) {
            console.error(err.message);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/tags/${activeTagId}`;
        if (navigator.share) {
            navigator.share({
                title: tagData?.name,
                text: `'${tagData?.name}' 태그를 확인해보세요!`,
                url: url,
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('링크가 클립보드에 복사되었습니다.');
        }
    };

    const toggleMap = () => setIsMapVisible(prev => !prev);

    if (loading) {
        return (
            <div className="p-4 h-full">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/3 mb-6" />
                <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                 <Button variant="ghost" onClick={hideTagDetail} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!tagData) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={hideTagDetail} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div>태그를 찾을 수 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <TagHeader
                tagData={{
                    name: tagData.name,
                    creator: tagData.creator,
                    subscriberCount: tagData.subscriberCount,
                    restaurantCount: tagData.restaurantCount,
                    isSubscribed: tagData.isSubscribed,
                }}
                onSubscribe={handleSubscribe}
                onShare={handleShare}
                onBack={hideTagDetail}
                isMapVisible={isMapVisible}
                onToggleMap={toggleMap}
            />
            <div className={`transition-all duration-300 ease-in-out ${isMapVisible ? 'h-1/2' : 'h-0'}`}>
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <Accordion 
                    type="single" 
                    collapsible 
                    className="w-full"
                    onValueChange={handleRestaurantSelect}
                >
                    {tagData.restaurants.map(restaurant => (
                        <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            session={session}
                            subscribedTagIds={[]}
                        />
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
