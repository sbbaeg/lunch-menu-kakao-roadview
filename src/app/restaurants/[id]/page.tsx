// src/app/restaurants/[id]/page.tsx
"use client";

import { MyReviewsDialog } from "@/components/MyReviewsDialog";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppRestaurant, Tag } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPanel } from '@/components/MapPanel';
import { RestaurantInfoPanel } from '@/components/RestaurantInfoPanel';
import { ReviewSection } from '@/components/ReviewSection';
import { TaggingDialog } from '@/components/TaggingDialog';
import { useFavorites } from '@/hooks/useFavorites';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useUserTags } from '@/hooks/useUserTags';

// Imports for Side Menu and Dialogs
import { SideMenuSheet } from '@/components/SideMenuSheet';
import { FavoritesDialog } from '@/components/FavoritesDialog';
import { BlacklistDialog } from '@/components/BlacklistDialog';
import { TagManagementDialog } from '@/components/TagManagementDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSubscriptions } from '@/hooks/useSubscriptions';

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const totalVotes = (restaurant?.likeCount ?? 0) + (restaurant?.dislikeCount ?? 0); // restaurant가 null일 수 있으므로 ?. 사용
  const likePercentage = totalVotes > 0 
    ? Math.round(((restaurant?.likeCount ?? 0) / totalVotes) * 100) 
    : null;

  // Hooks for data
  const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
  const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
  const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
  const { subscribedTagIds } = useSubscriptions();

  // State for dialogs
  const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null);
  const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);
  const [isMyReviewsOpen, setIsMyReviewsOpen] = useState(false);
  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

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
        setSelectedItemId(data.id);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id, router]);

  const handleBlacklistClick = () => {
    if (status === 'authenticated') {
        setIsBlacklistOpen(true);
    } else {
        setAlertInfo({ title: "오류", message: "로그인이 필요한 기능입니다." });
    }
  };

  // Tag handlers
  const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
    setRestaurant(updatedRestaurant);
    updateFavoriteInList(updatedRestaurant);
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

  const handleToggleTagLink = async (tag: Tag) => {
    if (!session?.user || !taggingRestaurant) return;
    const originalRestaurant = taggingRestaurant;
    const isCurrentlyTagged = taggingRestaurant.tags?.some(t => t.id === tag.id);
    const newTags = isCurrentlyTagged
      ? taggingRestaurant.tags?.filter(t => t.id !== tag.id)
      : [...(taggingRestaurant.tags || []), tag];
    const updatedRestaurant = { ...originalRestaurant, tags: newTags };
    handleTagsChange(updatedRestaurant);
    setTaggingRestaurant(updatedRestaurant);

    try {
      const response = await fetch(`/api/restaurants/${originalRestaurant.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, restaurant: originalRestaurant }),
      });
      if (!response.ok) {
        handleTagsChange(originalRestaurant);
        setTaggingRestaurant(originalRestaurant);
        alert("태그 변경에 실패했습니다.");
      }
    } catch (error) {
        handleTagsChange(originalRestaurant);
        setTaggingRestaurant(originalRestaurant);
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
    <main className="w-full min-h-screen p-4 md:p-8 relative bg-card">
        <div className="absolute top-2 right-2 z-50">
            <SideMenuSheet
                onShowFavorites={() => setIsFavoritesListOpen(true)}
                onShowBlacklist={handleBlacklistClick}
                onShowTagManagement={() => setIsTagManagementOpen(true)}
                onShowMyReviews={() => setIsMyReviewsOpen(true)}
            />
        </div>
        <div className="w-full max-w-7xl mx-auto">
            <div className="px-6 pt-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 w-fit p-0 h-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <h1 className="text-4xl font-bold">{restaurant.placeName}</h1>
            </div>
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 flex flex-col gap-8">
                        <Accordion type="single" collapsible defaultValue="map">
                            <AccordionItem value="map">
                                <AccordionTrigger className="text-lg font-semibold">지도 보기</AccordionTrigger>
                                <AccordionContent>
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
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <div className="w-full">
                            
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
                            likeCount={restaurant.likeCount}
                            dislikeCount={restaurant.dislikeCount}
                            likePercentage={likePercentage}
                        />
                    </div>
                </div>
            </div>
        </div>

        <TagManagementDialog
            isOpen={isTagManagementOpen}
            onOpenChange={setIsTagManagementOpen}
            userTags={userTags}
            onCreateTag={createTag}
            onDeleteTag={deleteTag}
            onToggleTagPublic={toggleTagPublic}
        />

        <FavoritesDialog
            isOpen={isFavoritesListOpen}
            onOpenChange={setIsFavoritesListOpen}
            favorites={favorites}
            session={session}
            subscribedTagIds={subscribedTagIds}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            isFavorite={isFavorite}
            isBlacklisted={isBlacklisted}
            onToggleFavorite={toggleFavorite}
            onToggleBlacklist={toggleBlacklist}
            onTagManagement={setTaggingRestaurant}
        />

        <BlacklistDialog
            isOpen={isBlacklistOpen}
            onOpenChange={setIsBlacklistOpen}
            blacklist={blacklist}
            onToggleBlacklist={toggleBlacklist}
        />

        <TaggingDialog
            restaurant={taggingRestaurant}
            onOpenChange={() => setTaggingRestaurant(null)}
            userTags={userTags}
            onToggleTagLink={handleToggleTagLink}
            onCreateAndLinkTag={handleCreateAndLinkTag}
            isBanned={session?.user?.isBanned ?? false}
        />

        <MyReviewsDialog
            isOpen={isMyReviewsOpen}
            onOpenChange={setIsMyReviewsOpen}
        />

        <AlertDialog open={!!alertInfo} onOpenChange={() => setAlertInfo(null)}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>{alertInfo?.title}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    {alertInfo?.message}
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setAlertInfo(null)}>확인</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </main>
  );
}