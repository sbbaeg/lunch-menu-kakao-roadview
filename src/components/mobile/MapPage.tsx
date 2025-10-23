"use client";

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ResultPanel } from "@/components/ResultPanel";
import { MapPanel, type MapPanelRef } from "@/components/MapPanel";

// This is now a presentational component. All logic is in MobileLayout.
export default function MapPage(props: any) {
    const {
        session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
        subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
        userLocation, handleSearchInArea, handleAddressSearch, setIsMapReady
    } = props;

    const activeTab = useAppStore((state) => state.activeTab);
    const isResultPanelExpanded = useAppStore((state) => state.isResultPanelExpanded);
    const isMapReady = useAppStore((state) => state.isMapReady); // isMapReady 상태 가져오기
    const mapPanelRef = useRef<MapPanelRef>(null);

    useEffect(() => {
        // 지도 탭이 활성화되고, 맵이 준비되었을 때 relayout을 호출
        if (activeTab === 'map' && isMapReady) {
            const timer = setTimeout(() => {
                mapPanelRef.current?.relayout();
            }, 100); // 레이아웃 변경을 위한 약간의 지연
            return () => clearTimeout(timer);
        }
    }, [activeTab, isMapReady]); // isMapReady를 의존성 배열에 추가

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden"> {/* relative, overflow-hidden 추가 */}
            {/* Top: Map Panel */}
            <div className="h-3/5 border-b">
                <MapPanel
                    ref={mapPanelRef}
                    restaurants={restaurantList}
                    selectedRestaurant={restaurantList.find((r: any) => r.id === selectedItemId) || null}
                    userLocation={userLocation}
                    onSearchInArea={handleSearchInArea}
                    onAddressSearch={(keyword: string, mode: 'place' | 'food', center: any) => handleAddressSearch(keyword, center)}
                    onMapReady={setIsMapReady}
                />
            </div>

            {/* Bottom: Result Panel */}
            <div 
              className={`
                absolute bottom-0 left-0 right-0 z-10 flex flex-col
                transition-all duration-300 ease-in-out
                ${isResultPanelExpanded ? 'h-full' : 'h-2/5'}
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
                />
            </div>
        </div>
    );
}