"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ResultPanel } from "@/components/ResultPanel";
import { MapPanel } from "@/components/MapPanel";

// This is now a presentational component. All logic is in MobileLayout.
export default function MapPage(props: any) {
    const {
        session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
        subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
        userLocation, handleSearchInArea, handleAddressSearch, setIsMapReady
    } = props;

    const activeTab = useAppStore((state) => state.activeTab);
    const isResultPanelExpanded = useAppStore((state) => state.isResultPanelExpanded);

    useEffect(() => {
        if (activeTab === 'map') {
            // The timeout gives the layout time to adjust before triggering the resize event.
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden"> {/* relative, overflow-hidden 추가 */}
            {/* Top: Map Panel */}
            <div className="h-3/5 border-b">
                <MapPanel
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