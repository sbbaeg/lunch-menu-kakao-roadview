// src/app/restaurants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapPanel } from '@/components/MapPanel';
import { RestaurantInfoPanel } from '@/components/RestaurantInfoPanel'; // 새로 만든 컴포넌트 import

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
    return null;
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
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2">
            <RestaurantInfoPanel restaurant={restaurant} />
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
