// src/app/restaurants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPanel } from '@/components/MapPanel';
import { RestaurantInfoPanel } from '@/components/RestaurantInfoPanel';
import { ReviewSection } from '@/components/ReviewSection';
import { TaggingDialog } from '@/components/TaggingDialog';
import { useFavorites } from '@/hooks/useFavorites';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useUserTags } from '@/hooks/useUserTags';

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Tag handlers
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
            <Skeleton className="h-10 w-28 mb-4" />
            <Card><CardHeader><Skeleton className="h-12 w-1/2" /></CardHeader><CardContent><div className="flex flex-col md:flex-row gap-8"><div className="w-full md:w-1/2"><Skeleton className="h-[500px] w-full" /></div><div className="w-full md:w-1/2 space-y-6"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-10 w-full" /></div></div></CardContent></Card>
        </main>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <main className="w-full min-h-screen p-4 md:p-8">
        <Card>
            <CardHeader>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 w-fit p-0 h-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <h1 className="text-4xl font-bold">{restaurant.placeName}</h1>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 flex flex-col gap-8">
                        <div className="aspect-video w-full">
                            <MapPanel 
                                restaurants={[restaurant]}
                                selectedRestaurant={restaurant}
                                userLocation={null}
                                onSearchInArea={() => {}}
                                onAddressSearch={() => {}}
                                showSearchBar={false}
                            />
                        </div>
                        <div className="w-full">
                            <h2 className="text-3xl font-bold mb-4">사용자 리뷰</h2>
                            {restaurant.dbId ? (
                                <ReviewSection restaurantId={restaurant.dbId} />
                            ) : (
                                <div className="p-8 border rounded-lg text-center text-gray-500">
                                    <p>리뷰를 불러올 수 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-1/2">
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
            </CardContent>
        </Card>

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