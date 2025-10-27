"use client";

import { useState, useEffect } from 'react';
import BottomTabBar from './BottomTabBar';
import MapPage from './MapPage';
import FavoritesPage from './FavoritesPage';
import RoulettePage from './RoulettePage'; // 룰렛 페이지 컴포넌트 import
import MyPage from './MyPage'; // 마이페이지 컴포넌트 import

import { Skeleton } from '@/components/ui/skeleton';

// 스플래시 화면을 위한 스켈레톤 컴포넌트
const SplashScreen = () => (
    <div className="h-full w-full flex flex-col">
        <div className="h-3/5 border-b">
            <Skeleton className="w-full h-full" />
        </div>
        <div className="h-2/5 flex flex-col p-2">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-16 w-full mb-2" />
            <Skeleton className="h-16 w-full mb-2" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);

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
import TagDetailPage from './TagDetailPage';
import RestaurantDetailPage from './RestaurantDetailPage';
import TagExplorePage from './TagExplorePage';
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
    const activeView = useAppStore((state) => state.activeView);
    const setActiveTab = useAppStore((state) => state.setActiveTab);
    const isMapReady = useAppStore((state) => state.isMapReady);
    const setIsMapReady = useAppStore((state) => state.setIsMapReady);

    // All hooks and state management from the original page component
    const { data: session, status } = useSession();

    const selectedItemId = useAppStore((state) => state.selectedItemId);
    const restaurantList = useAppStore((state) => state.restaurantList);
    const userLocation = useAppStore((state) => state.userLocation);
    const filters = useAppStore((state) => state.filters);
    const displayedSortOrder = useAppStore((state) => state.displayedSortOrder);
    const blacklistExcludedCount = useAppStore((state) => state.blacklistExcludedCount);
    const loading = useAppStore((state) => state.loading);

    const setSelectedItemId = useAppStore((state) => state.setSelectedItemId);
    const setFilters = useAppStore((state) => state.setFilters);
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
        setActiveTab('map');
        const result = await recommendProcess(false);
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        }
    };

    const mapPageProps = { // Props for MapPage
        session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
        subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
        userLocation, handleSearchInArea, handleAddressSearch, setIsMapReady,
        onOpenFilter: () => setIsFilterOpen(true), // 필터 열기 함수 전달
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

    if (!isMapReady) {
        return <SplashScreen />;
    }

    const myPageProps = {
        onShowFavorites: () => setIsFavoritesListOpen(true),
        onShowBlacklist: () => setIsBlacklistOpen(true),
        onShowTagManagement: () => setIsTagManagementOpen(true),
    };

    return (
        <div className="h-dvh w-screen relative">
            {activeView === 'tabs' ? (
                <>
                    {/* 메인 컨텐츠 영역: 하단 탭 바(h-20)를 제외한 전체 공간 차지 */}
                    <main className="absolute top-0 left-0 right-0 bottom-20">
                        <div className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}><MapPage {...mapPageProps} /></div>
                        <div className={`w-full h-full ${activeTab === 'favorites' ? 'block' : 'hidden'}`}><FavoritesPage {...favoritesPageProps} /></div>
                        <div className={`w-full h-full ${activeTab === 'roulette' ? 'block' : 'hidden'}`}><RoulettePage /></div>
                        <div className={`w-full h-full ${activeTab === 'my-page' ? 'block' : 'hidden'}`}><MyPage {...myPageProps} /></div>
                    </main>

                    {/* 하단 탭 바: 화면 맨 아래에 고정 */}
                    <div className="absolute bottom-0 left-0 right-0 h-20">
                        <BottomTabBar 
                            onSearchClick={handleCentralSearchClick} 
                        />
                    </div>
                </>
            ) : activeView === 'tagDetail' ? (
                <main className="absolute inset-0">
                    <TagDetailPage />
                </main>
            ) : activeView === 'restaurantDetail' ? (
                <main className="absolute inset-0">
                    <RestaurantDetailPage />
                </main>
            ) : ( // tagExplore
                <main className="absolute inset-0">
                    <TagExplorePage />
                </main>
            )}

            {/* 다이얼로그들은 레이아웃 흐름에 영향을 주지 않음 */}
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
                onNavigate={() => setIsFavoritesListOpen(false)} // 네비게이트 시 다이얼로그 닫기
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