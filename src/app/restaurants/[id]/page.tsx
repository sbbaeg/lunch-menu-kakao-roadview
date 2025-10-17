// src/app/restaurants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapPanel } from '@/components/MapPanel';
import { RestaurantDetails } from '@/components/RestaurantDetails'; // 상세 정보 컴포넌트를 새로 만들거나 기존 것을 재활용

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          // 데이터 가져오기 실패 시 홈페이지로 리디렉션
          router.push('/');
          return;
        }
        const data = await response.json();
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id, router]);

  if (loading) {
    return <div className="p-8"><Skeleton className="w-full h-[80vh]" /></div>;
  }

  if (!restaurant) {
    return null; // 로딩 후에도 데이터가 없으면 아무것도 렌더링하지 않음 (이미 리디렉션됨)
  }

  return (
    <main className="w-full min-h-screen p-4 md:p-8">
      <header className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
        <h1 className="text-4xl font-bold">{restaurant.placeName}</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full lg:w-1/2">
            <div className="h-[500px] w-full mb-8">
                 <MapPanel 
                    restaurants={[restaurant]}
                    selectedRestaurant={restaurant}
                    userLocation={null}
                    onSearchInArea={() => {}}
                    onAddressSearch={() => {}}
                    hideControls={true}
                />
            </div>
            {/* 나중에 사진 갤러리가 들어올 자리 */}
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2">
            {/* RestaurantDetails 컴포넌트를 사용하여 정보 표시 */}
            {/* 이 컴포넌트는 RestaurantCard의 내용을 재활용하여 만들 수 있습니다. */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold mb-3">정보</h2>
                    <p><strong>카테고리:</strong> {restaurant.categoryName}</p>
                    <p><strong>주소:</strong> {restaurant.address}</p>
                    <p><strong>구글 평점:</strong> {restaurant.googleDetails?.rating ?? 'N/A'} / 5</p>
                </div>
                 <div>
                    <h2 className="text-2xl font-semibold mb-3">태그</h2>
                    <div className="flex flex-wrap gap-2">
                        {restaurant.tags?.map(tag => (
                            <span key={tag.id} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">#{tag.name}</span>
                        ))}
                    </div>
                </div>
                {/* 나중에 핵심 기능 버튼(즐겨찾기 등)이 들어올 자리 */}
            </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-4">사용자 리뷰</h2>
        <div className="p-8 border rounded-lg text-center text-gray-500">
          <p>리뷰 기능은 현재 준비 중입니다.</p>
        </div>
      </div>

    </main>
  );
}
