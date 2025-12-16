"use client";

import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ResultPanel } from "@/components/ResultPanel";
import { MapPanel } from "@/components/MapPanel";
import { AppRestaurant } from '@/lib/types';

// This is now a presentational component. All logic is in MobileLayout.
export default function MapPage(props: any) {
    const {
        session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
        subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
        userLocation, handleSearchInArea, handleAddressSearch,
        onOpenFilter // 필터 열기 함수 받기
    } = props;

    const selectedRestaurant = useMemo(() => {
        return restaurantList.find((r: AppRestaurant) => r.id === selectedItemId) || null;
    }, [restaurantList, selectedItemId]);

    const resultPanelState = useAppStore((state) => state.resultPanelState);

    const getPanelHeights = () => {
        switch (resultPanelState) {
            case 'expanded':
                return { map: 'h-0', result: 'h-full' };
            case 'collapsed':
                // 핸들러 높이(h-6)를 고려하여 지도 패널이 거의 전체를 차지하도록 함
                return { map: 'h-[calc(100%-1.5rem)]', result: 'h-6' };
            default: // 'default'
                return { map: 'h-3/5', result: 'h-2/5' };
        }
    };

    const panelHeights = getPanelHeights();

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden"> {/* relative, overflow-hidden 추가 */}
            {/* Top: Map Panel */}
            <div className={`border-b transition-all duration-300 ease-in-out ${panelHeights.map}`}>
                <MapPanel
                    restaurants={restaurantList}
                    selectedRestaurant={selectedRestaurant}
                    userLocation={userLocation}
                    onSearchInArea={handleSearchInArea}
                    onAddressSearch={(keyword, mode, center) => handleAddressSearch(keyword, center)}
                />
            </div>

            {/* Bottom: Result Panel */}
            <div 
              className={`
                absolute bottom-0 left-0 right-0 z-10 flex flex-col
                transition-all duration-300 ease-in-out
                ${panelHeights.result}
              `}
            >
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
                    onOpenFilter={onOpenFilter} // 필터 열기 함수 전달
                />
            </div>
        </div>
    );
}