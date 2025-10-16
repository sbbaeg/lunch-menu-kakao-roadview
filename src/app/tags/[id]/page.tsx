// app/tags/[id]/page.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Share2, Star } from 'lucide-react';
import { AppRestaurant } from '@/lib/types'; // 메인 페이지의 타입을 재사용합니다.
import { TagHeader } from "@/components/TagHeader";
import { MapPanel } from '@/components/MapPanel';
import { Accordion } from '@/components/ui/accordion';
import { RestaurantCard } from '@/components/RestaurantCard';
import { useSubscriptions } from '@/hooks/useSubscriptions';

// 페이지에서 사용할 데이터의 타입을 정의합니다.
interface TagProfileData {
    id: number;
    name: string;
    creator: {
        id: string;
        name: string | null;
    };
    restaurants: AppRestaurant[];
    isSubscribed: boolean;
    subscriberCount: number;
    restaurantCount: number; 
}

export default function TagProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [tagData, setTagData] = useState<TagProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
    const { subscribedTagIds } = useSubscriptions();

    const tagId = params.id;

    // 1. 태그 프로필 데이터를 불러오는 useEffect
    useEffect(() => {
        const fetchData = async () => {
            if (!tagId) return;
            setLoading(true);
            try {
                const response = await fetch(`/api/tags/${tagId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTagData(data);
                } else {
                    // 존재하지 않는 태그일 경우 홈으로 리다이렉트
                    router.push('/');
                }
            } catch (error) {
                console.error("태그 데이터 로딩 실패:", error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tagId, router]);

    const handleSubscribe = async () => {
        if (status !== 'authenticated' || !tagData) return;
        
        // 낙관적 업데이트
        const originalData = { ...tagData };
        setTagData(prev => prev ? { ...prev, isSubscribed: !prev.isSubscribed } : null);

        try {
            const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
            if (!response.ok) {
                setTagData(originalData); // 실패 시 롤백
            }
        } catch (error) {
            setTagData(originalData); // 실패 시 롤백
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('링크가 클립보드에 복사되었습니다!');
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            alert('링크 복사에 실패했습니다.');
        }
    };

    // 로딩 중일 때 스켈레톤 UI 표시
    if (loading) {
        return (
            <main className="w-full min-h-screen p-4 md:p-8">
                <Skeleton className="h-10 w-48 mb-4" />
                <div className="flex flex-col md:flex-row gap-6">
                    <Skeleton className="w-full h-[400px] md:h-auto md:w-2/3 rounded-lg" />
                    <Skeleton className="w-full md:w-1/3 h-[400px] md:h-auto rounded-lg" />
                </div>
            </main>
        );
    }

    if (!tagData) return null; // 데이터가 없는 경우 (보통 리다이렉트됨)

    return (
        <main className="w-full min-h-screen">
            <div className="p-4 md:p-8">
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
                />

                {/* 본문: 지도와 음식점 목록 */}
                <div className="flex flex-col md:flex-row gap-6" style={{ height: 'calc(100vh - 150px)' }}>
                    {/* 왼쪽 지도 패널 */}
                    <div className="w-full h-[400px] md:h-full md:w-2/3">
                        <MapPanel 
                            restaurants={tagData.restaurants}
                            hideControls={true}
                            selectedRestaurant={tagData.restaurants.find(r => r.id === selectedItemId) || null}
                            userLocation={null}
                            onSearchInArea={() => {}}
                            onAddressSearch={() => {}}
                        />
                    </div>

                    {/* 오른쪽 음식점 목록 패널 */}
                    <div className="w-full md:w-1/3 h-full overflow-y-auto">
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            value={selectedItemId}
                            onValueChange={setSelectedItemId}
                        >
                            {tagData.restaurants.map(place => (
                                <RestaurantCard
                                    key={place.id}
                                    restaurant={place}
                                    session={session}
                                    subscribedTagIds={subscribedTagIds}
                                    // 이 페이지에서는 즐겨찾기/블랙리스트 기능이 필요 없으므로
                                    // 관련 props를 전달하지 않습니다.
                                />
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </main>
    );
}