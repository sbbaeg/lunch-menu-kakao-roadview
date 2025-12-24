"use client";
//리펙토링한 컴포넌트
import { FilterDialog, type FilterState } from "@/components/FilterDialog"; //필터
import { ResultPanel } from "@/components/ResultPanel"; //오른쪽 결과
import { MapPanel } from "@/components/MapPanel";  //지도
import { MainControlPanel } from "@/components/MainControlPanel"; //오른쪽 버튼
import { RouletteDialog } from "@/components/RouletteDialog"; //룰렛
import { AppHeader } from "@/components/AppHeader"; // 공통 헤더
import { toast } from "sonner";

//논리구조 리펙토링
import { useFavorites } from "@/hooks/useFavorites";
import { useBlacklist } from "@/hooks/useBlacklist";
import { useUserTags } from "@/hooks/useUserTags";
import { useSubscriptions } from "@/hooks/useSubscriptions";

import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant } from '@/lib/types';
import { useSession } from "next-auth/react";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
    const { data: session } = useSession();

    const {
        selectedItemId,
        restaurantList,
        userLocation,
        filters,
        displayedSortOrder,
        blacklistExcludedCount,
        loading,
        isMapReady,
        setSelectedItemId,
        setFilters,
        recommendProcess,
        handleSearchInArea,
        handleAddressSearch,
        handleRouletteResult,
        handleTagsChange: updateRestaurantInStore,
        setTaggingRestaurant,
    } = useAppStore();

    // --- 페이지 레벨 훅 ---
    const { isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
    const { isBlacklisted, toggleBlacklist } = useBlacklist();
    const { userTags } = useUserTags();
    const { subscribedTagIds } = useSubscriptions();

    // --- 페이지 레벨 상태 ---
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

    const selectedRestaurant = useMemo(() => 
        restaurantList.find(r => r.id === selectedItemId) || null,
        [restaurantList, selectedItemId]
    );

    const onAddressSearchCallback = useCallback((keyword: string, mode: 'place' | 'food', center: { lat: number, lng: number }) => {
        handleAddressSearch(keyword, center);
    }, [handleAddressSearch]);

    useEffect(() => {
        // 카카오톡 인앱 브라우저인지 확인
        if (/KAKAOTALK/i.test(navigator.userAgent)) {
            const kakaoOpenUrl = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
            if (confirm("원활한 로그인을 위해 외부 브라우저로 이동합니다.")) {
                window.location.href = kakaoOpenUrl;
            }
        }
    }, []);

    const handleSearchClick = async () => {
        const result = await recommendProcess(false);
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        } else if (result.isRoulette) {
            setIsRouletteOpen(true);
        }
    };
    
    const handleRouletteClick = async () => {
        const result = await recommendProcess(true);
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        } else if (result.isRoulette) {
            setIsRouletteOpen(true);
        }
    };

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
        updateRestaurantInStore(updatedRestaurant);
        updateFavoriteInList(updatedRestaurant);
    };

    return (
        <main className="w-full min-h-screen flex flex-col items-center p-4 md:p-8 bg-card">
            <AppHeader />
            
            <div className="w-full max-w-6xl p-6 md:p-8 flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                <div className="w-full md:w-3/5 h-[400px] md:h-full">
                    <MapPanel
                        restaurants={restaurantList}
                        selectedRestaurant={selectedRestaurant}
                        userLocation={userLocation}
                        onSearchInArea={handleSearchInArea}
                        onAddressSearch={onAddressSearchCallback}
                    />
                </div>

                <div className="w-full md:w-2/5 flex flex-col gap-2 flex-1 min-h-0">
                    <MainControlPanel
                        isSearchDisabled={loading || !isMapReady} 
                        onSearchClick={handleSearchClick} 
                        onRouletteClick={handleRouletteClick} 
                        onFilterClick={() => setIsFilterOpen(true)}
                    />
                    <p className="text-xs text-muted-foreground text-center px-4 py-2">
                        기본 검색은 식사 위주의 장소를 추천합니다.<br />
                        카페, 주점, 베이커리 등은 필터에서 직접 선택해주세요.
                    </p>
                    <ResultPanel
                        isLoading={loading} 
                        restaurants={restaurantList} 
                        blacklistExcludedCount={blacklistExcludedCount} 
                        displayedSortOrder={displayedSortOrder} 
                        selectedItemId={selectedItemId} 
                        setSelectedItemId={setSelectedItemId} 
                        session={session}
                        subscribedTagIds={subscribedTagIds}
                        isFavorite={isFavorite}
                        isBlacklisted={isBlacklisted}
                        onToggleFavorite={toggleFavorite}
                        onToggleBlacklist={toggleBlacklist}
                        onTagManagement={setTaggingRestaurant}
                        onOpenFilter={() => setIsFilterOpen(true)}
                    />
                </div>
            </div>

            <FilterDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                userTags={userTags}
            />

            <RouletteDialog
                isOpen={isRouletteOpen}
                onOpenChange={setIsRouletteOpen}
                items={useAppStore.getState().rouletteItems} 
                onResult={handleRouletteResult} 
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