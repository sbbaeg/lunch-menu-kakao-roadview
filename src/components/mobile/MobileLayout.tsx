"use client";

import { useState, useEffect, useRef } from 'react';
import BottomTabBar from './BottomTabBar';
import MapPage from './MapPage';
import FavoritesPage from './FavoritesPage'; // Import the new FavoritesPage component
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';

// Placeholder pages
const RoulettePage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">룰렛 화면</div>;
const MyPage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">마이페이지</div>;

// All logic and state lifted from MapPage to here
import { FilterDialog, type FilterState } from "@/components/FilterDialog";
import { FavoritesDialog } from "@/components/FavoritesDialog";
import { BlacklistDialog } from "@/components/BlacklistDialog";
import { TagManagementDialog } from "@/components/TagManagementDialog";
import { TaggingDialog } from "@/components/TaggingDialog";
import { RouletteDialog } from "@/components/RouletteDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useBlacklist } from "@/hooks/useBlacklist";
import { useUserTags } from "@/hooks/useUserTags";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant, Tag } from '@/lib/types';
import { useSession } from "next-auth/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MobileLayout() {
    const activeTab = useAppStore((state) => state.activeTab);
    const setActiveTab = useAppStore((state) => state.setActiveTab);
    const { isStandalone } = usePwaDisplayMode();
    const isInitialLoad = useRef(true);

    useEffect(() => {
        // PWA 환경의 초기 로드 시에만 실행
        if (isStandalone && isInitialLoad.current) {
            const initialTab = useAppStore.getState().activeTab;
            if (initialTab === 'map') {
                // 다른 탭으로 갔다가 돌아오는 효과를 주기 위한 타이머
                const timer1 = setTimeout(() => {
                    setActiveTab('favorites');
                }, 50);

                const timer2 = setTimeout(() => {
                    setActiveTab('map');
                }, 100);

                // 클린업
                return () => {
                    clearTimeout(timer1);
                    clearTimeout(timer2);
                };
            }
        }
        isInitialLoad.current = false;
    }, [isStandalone, setActiveTab]);


    // All hooks and state management from the original page component
    const { data: session, status } = useSession();

    const selectedItemId = useAppStore((state) => state.selectedItemId);
    const restaurantList = useAppStore((state) => state.restaurantList);
    const userLocation = useAppStore((state) => state.userLocation);
    const filters = useAppStore((state) => state.filters);
    const displayedSortOrder = useAppStore((state) => state.displayedSortOrder);
    const blacklistExcludedCount = useAppStore((state) => state.blacklistExcludedCount);
    const loading = useAppStore((state) => state.loading);
    const isMapReady = useAppStore((state) => state.isMapReady);

    const setSelectedItemId = useAppStore((state) => state.setSelectedItemId);
    const setFilters = useAppStore((state) => state.setFilters);
    const setIsMapReady = useAppStore((state) => state.setIsMapReady);
    const recommendProcess = useAppStore((state) => state.recommendProcess);
    const handleSearchInArea = useAppStore((state) => state.handleSearchInArea);
    const handleAddressSearch = useAppStore((state) => state.handleAddressSearch);
    const handleRouletteResult = useAppStore((state) => state.handleRouletteResult);
    const updateRestaurantInStore = useAppStore((state) => state.handleTagsChange);

    const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
    const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
    const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
    const { subscribedTagIds } = useSubscriptions();

    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);
    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);
    const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null);

    // Handlers
    const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
        updateRestaurantInStore(updatedRestaurant);
        updateFavoriteInList(updatedRestaurant);
    };

    const handleCreateTag = async (name: string) => {
        if (!name.trim() || !taggingRestaurant) return;
        const newTag = await createTag(name);
        if (newTag) {
            const linkResponse = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId: newTag.id, restaurant: taggingRestaurant }),
            });
            if (linkResponse.ok) {
                const updatedRestaurant = { ...taggingRestaurant, tags: [...(taggingRestaurant.tags || []), newTag] };
                handleTagsChange(updatedRestaurant);
                setTaggingRestaurant(updatedRestaurant);
            } else {
                setAlertInfo({ title: "오류", message: "태그 연결에 실패했습니다." });
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
                setAlertInfo({ title: "오류", message: "태그 변경에 실패했습니다." });
            }
        } catch (error) {
            handleTagsChange(originalRestaurant);
            setTaggingRestaurant(originalRestaurant);
            setAlertInfo({ title: "오류", message: "태그 변경 중 네트워크 오류가 발생했습니다." });
        }
    };

    const handleCentralSearchClick = async () => {
        const result = await recommendProcess(false);
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        }
    };

    const renderContent = () => {
        const mapPageProps = { // Props for MapPage
            session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
            subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
            userLocation, handleSearchInArea, handleAddressSearch, setIsMapReady
        };

        const favoritesPageProps = { // Props for FavoritesPage
            favorites,
            session,
            subscribedTagIds,
            selectedItemId,
            setSelectedItemId,
            isFavorite,
            isBlacklisted,
            onToggleFavorite: toggleFavorite,
            onToggleBlacklist: toggleBlacklist,
            onTagManagement: setTaggingRestaurant,
        };

        switch (activeTab) {
            case 'map':
                return <MapPage {...mapPageProps} />;
            case 'favorites':
                return <FavoritesPage {...favoritesPageProps} />;
            case 'roulette':
                return <RoulettePage />;
            case 'my-page':
                return <MyPage />;
            default:
                return <MapPage {...mapPageProps} />;
        }
    };

    return (
        <div className="h-dvh w-screen flex flex-col bg-background">
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>

            <BottomTabBar 
                onSearchClick={handleCentralSearchClick} 
            />

            {/* All dialogs are now managed by the layout */}
            <FilterDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                initialFilters={filters}
                onApplyFilters={(newFilters) => setFilters(newFilters)}
                userTags={userTags}
            />
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
            <RouletteDialog
                isOpen={isRouletteOpen}
                onOpenChange={setIsRouletteOpen}
                items={useAppStore.getState().rouletteItems}
                onResult={handleRouletteResult}
            />
            <TaggingDialog
                restaurant={taggingRestaurant}
                onOpenChange={() => setTaggingRestaurant(null)}
                userTags={userTags}
                onToggleTagLink={handleToggleTagLink}
                onCreateAndLinkTag={handleCreateTag}
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
        </div>
    );
}