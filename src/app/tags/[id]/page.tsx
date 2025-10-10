// app/tags/[id]/page.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Share2, Star } from 'lucide-react';
import { Restaurant } from '@/lib/types'; // 메인 페이지의 타입을 재사용합니다.

// 페이지에서 사용할 데이터의 타입을 정의합니다.
interface TagProfileData {
    id: number;
    name: string;
    creator: {
        id: string;
        name: string | null;
    };
    restaurants: Restaurant[];
    isSubscribed: boolean;
}

export default function TagProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [tagData, setTagData] = useState<TagProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<any>(null); // 카카오맵 인스턴스
    const markers = useRef<any[]>([]); // 마커 배열

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

    // 2. 카카오맵을 초기화하고 마커를 표시하는 useEffect
    useEffect(() => {
        if (tagData && tagData.restaurants.length > 0 && mapContainer.current) {
            const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_JS_KEY;
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
            script.async = true;
            document.head.appendChild(script);

            script.onload = () => {
                window.kakao.maps.load(() => {
                    const center = new window.kakao.maps.LatLng(
                        Number(tagData.restaurants[0].y),
                        Number(tagData.restaurants[0].x)
                    );
                    const mapOption = { center: center, level: 5 };
                    mapInstance.current = new window.kakao.maps.Map(mapContainer.current!, mapOption);

                    // 마커 표시
                    markers.current.forEach(marker => marker.setMap(null));
                    markers.current = [];
                    tagData.restaurants.forEach(place => {
                        const position = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
                        const marker = new window.kakao.maps.Marker({ position });
                        marker.setMap(mapInstance.current);
                        markers.current.push(marker);
                    });
                });
            };
        }
    }, [tagData]);


    // 3. 구독 버튼 핸들러
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
                {/* 헤더: 뒤로가기, 태그 정보, 구독/공유 버튼 */}
                <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{tagData.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                by {tagData.creator.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'authenticated' && tagData.creator.id !== session?.user?.id && (
                             <Button onClick={handleSubscribe} variant={tagData.isSubscribed ? "default" : "outline"}>
                                <Star className={`mr-2 h-4 w-4 ${tagData.isSubscribed ? "fill-white" : ""}`} />
                                {tagData.isSubscribed ? '구독중' : '구독하기'}
                            </Button>
                        )}
                        <Button variant="secondary" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            공유
                        </Button>
                    </div>
                </header>

                {/* 본문: 지도와 음식점 목록 */}
                <div className="flex flex-col md:flex-row gap-6" style={{ height: 'calc(100vh - 150px)' }}>
                    {/* 왼쪽 지도 패널 */}
                    <div ref={mapContainer} className="w-full h-[400px] md:h-full md:w-2/3 rounded-lg border shadow-sm" />

                    {/* 오른쪽 음식점 목록 패널 */}
                    <div className="w-full md:w-1/3 h-full overflow-y-auto">
                        <div className="space-y-2">
                            {tagData.restaurants.map(place => (
                                <Card key={place.id} className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-md">{place.placeName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        <p>{place.categoryName?.split('>').pop()?.trim()}</p>
                                        <p>{place.address}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}