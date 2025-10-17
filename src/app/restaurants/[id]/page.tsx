// src/app/restaurants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapPanel } from '@/components/MapPanel';
import { RestaurantInfoPanel } from '@/components/RestaurantInfoPanel';
import { TaggingDialog } from '@/components/TaggingDialog'; // TaggingDialog 추가

// 메인 페이지에서 사용하던 훅들을 모두 import
import { useFavorites } from '@/hooks/useFavorites';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useUserTags } from '@/hooks/useUserTags';

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // 메인 페이지와 동일하게 훅들을 사용
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isBlacklisted, toggleBlacklist } = useBlacklist();
  const { userTags, createTag } = useUserTags();
  const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null);

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

  // 태그 관련 핸들러 함수들 (메인 페이지 로직 재사용)
  const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
    setRestaurant(updatedRestaurant);
  };

  const handleCreateAndLinkTag = async (name: string) => {
    if (!name.trim() || !taggingRestaurant) return;
    const newTag = await createTag(name);
    if (newTag) {
      const linkResponse = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: newTag.id, restaurant: taggingRestaurant }),
      });
      if (linkResponse.ok) {
        const updatedRestaurant = {
          ...taggingRestaurant,
          tags: [...(taggingRestaurant.tags || []), newTag],
        };
        handleTagsChange(updatedRestaurant);
        setTaggingRestaurant(updatedRestaurant);
      } else {
        alert("태그 연결에 실패했습니다.");
      }
    }
  };

  const handleToggleTagLink = async (tag: any) => {
    if (!session?.user || !taggingRestaurant) return;
    const isCurrentlyTagged = taggingRestaurant.tags?.some(t => t.id === tag.id);
    const newTags = isCurrentlyTagged
      ? taggingRestaurant.tags?.filter(t => t.id !== tag.id)
      : [...(taggingRestaurant.tags || []), tag];
    const updatedRestaurant = { ...taggingRestaurant, tags: newTags };
    handleTagsChange(updatedRestaurant);
    setTaggingRestaurant(updatedRestaurant);

    try {
      const response = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, restaurant: taggingRestaurant }),
      });
      if (!response.ok) {
        // 실패 시 롤백 (UI)
        handleTagsChange(taggingRestaurant);
        setTaggingRestaurant(taggingRestaurant);
        alert("태그 변경에 실패했습니다.");
      }
    } catch (error) {
        handleTagsChange(taggingRestaurant);
        setTaggingRestaurant(taggingRestaurant);
        alert("태그 변경 중 네트워크 오류가 발생했습니다.");
    }
  };


  if (loading) {
    return (
        <main className="w-full min-h-screen p-4 md:p-8">
            <div className="mb-6">
                <Skeleton className="h-10 w-28 mb-4" />
                <Skeleton className="h-12 w-1/2" />
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/2"><Skeleton className="h-[500px] w-full" /></div>
                <div className="w-full lg:w-1/2 space-y-6">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </main>
    );
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

        <div className="w-full lg:w-1/2">
            <RestaurantInfoPanel 
                restaurant={restaurant} 
                session={session}
                isFavorite={isFavorite}
                isBlacklisted={isBlacklisted}
                onToggleFavorite={toggleFavorite}
                onToggleBlacklist={toggleBlacklist}
                onTagManagement={setTaggingRestaurant}
            />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-4">사용자 리뷰</h2>
        <div className="p-8 border rounded-lg text-center text-gray-500">
          <p>리뷰 기능은 현재 준비 중입니다.</p>
        </div>
      </div>

      <TaggingDialog
        restaurant={taggingRestaurant}
        onOpenChange={() => setTaggingRestaurant(null)}
        userTags={userTags}
        onToggleTagLink={handleToggleTagLink}
        onCreateAndLinkTag={handleCreateAndLinkTag}
      />
    </main>
  );
}
