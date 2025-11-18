// app/tags/[id]/page.tsx

"use client";

import { MyReviewsDialog } from "@/components/MyReviewsDialog";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { AppRestaurant, Tag } from '@/lib/types'; 
import { TagHeader } from "@/components/TagHeader";
import { TagReviewSection } from "@/components/TagReviewSection";
import { MapPanel } from '@/components/MapPanel';
import { Accordion } from '@/components/ui/accordion';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Separator } from "@/components/ui/separator";

// Hooks
import { useFavorites } from '@/hooks/useFavorites';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useUserTags } from '@/hooks/useUserTags';
import { useSubscriptions } from '@/hooks/useSubscriptions';

// Components for Side Menu
import { SideMenuSheet } from '@/components/SideMenuSheet';
import { FavoritesDialog } from '@/components/FavoritesDialog';
import { BlacklistDialog } from '@/components/BlacklistDialog';
import { TagManagementDialog } from '@/components/TagManagementDialog';
import { TaggingDialog } from '@/components/TaggingDialog';
import { toast } from "@/components/ui/toast";


// 페이지에서 사용할 데이터의 타입을 정의합니다。
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
    const [selectedItemId, setSelectedItemId] = useState<string>("");

    // Hooks for side menu functionality
    const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
    const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
    const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
    const { subscribedTagIds } = useSubscriptions();

    // State for dialogs
    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);
    const [isMyReviewsOpen, setIsMyReviewsOpen] = useState(false);
    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
    const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null);

    const tagId = params.id;

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

    const handleBlacklistClick = () => {
        if (status === 'authenticated') {
            setIsBlacklistOpen(true);
        } else {
            toast({
                variant: "destructive",
                description: "로그인이 필요한 기능입니다.",
            });
        }
    };

    const handleSubscribe = async () => {
        if (status !== 'authenticated' || !tagData) return;
        
        const originalData = { ...tagData };
        setTagData(prev => prev ? { ...prev, isSubscribed: !prev.isSubscribed, subscriberCount: prev.isSubscribed ? prev.subscriberCount - 1 : prev.subscriberCount + 1 } : null);

        try {
            const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
            if (!response.ok) {
                setTagData(originalData); // 실패 시 롤백
                toast({
                    variant: "destructive",
                    description: "구독 처리에 실패했습니다.",
                });
            }
        } catch (error) {
            setTagData(originalData); // 실패 시 롤백
            toast({
                variant: "destructive",
                description: "구독 처리 중 오류가 발생했습니다.",
            });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                description: '링크가 클립보드에 복사되었습니다!',
            });
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            toast({
                variant: "destructive",
                description: '링크 복사에 실패했습니다.',
            });
        }
    };

    const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
        setTagData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                restaurants: prevData.restaurants.map(r => 
                    r.id === updatedRestaurant.id ? updatedRestaurant : r
                )
            };
        });
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
                toast({
                    variant: "destructive",
                    description: "태그 연결에 실패했습니다.",
                });
            }
        }
    };

    const handleToggleTagLink = async (tag: Tag) => {
        if (!session?.user || !taggingRestaurant) return;
        const originalRestaurant = taggingRestaurant;
        const isCurrentlyTagged = originalRestaurant.tags?.some(t => t.id === tag.id);
        const newTags = isCurrentlyTagged
            ? originalRestaurant.tags?.filter(t => t.id !== tag.id)
            : [...(originalRestaurant.tags || []), tag];
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
                toast({
                    variant: "destructive",
                    description: "태그 변경에 실패했습니다.",
                });
            }
        } catch (error) {
            handleTagsChange(originalRestaurant);
            setTaggingRestaurant(originalRestaurant);
            toast({
                variant: "destructive",
                description: "태그 변경 중 네트워크 오류가 발생했습니다.",
            });
        }
    };

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

    if (!tagData) return null;

    return (
        <main className="w-full min-h-screen relative bg-card">
            <div className="absolute top-2 right-2 z-50">
                <SideMenuSheet
                    onShowFavorites={() => setIsFavoritesListOpen(true)}
                    onShowBlacklist={handleBlacklistClick}
                    onShowTagManagement={() => setIsTagManagementOpen(true)}
                    onShowMyReviews={() => setIsMyReviewsOpen(true)}
                />
            </div>
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

                <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-150px)]">
                    <div className="w-full h-3/5 md:h-full md:w-2/3">
                        <MapPanel 
                            restaurants={tagData.restaurants}
                            selectedRestaurant={tagData.restaurants.find(r => r.id === selectedItemId) || null}
                            userLocation={null}
                            onSearchInArea={() => {}}
                            onAddressSearch={() => {}}
                            showSearchBar={false}
                        />
                    </div>

                    <div className="w-full h-2/5 md:w-1/3 md:h-full overflow-y-auto">
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
                                    isFavorite={isFavorite}
                                    isBlacklisted={isBlacklisted}
                                    onToggleFavorite={toggleFavorite}
                                    onToggleBlacklist={toggleBlacklist}
                                    onTagManagement={setTaggingRestaurant}
                                />
                            ))}
                        </Accordion>
                    </div>
                </div>

                <Separator className="my-8" />

                <TagReviewSection tagId={tagData.id} />
            </div>

            {/* Dialogs */}
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
        </main>
    );
}