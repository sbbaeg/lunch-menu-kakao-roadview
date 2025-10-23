"use client";

import { ResultPanel } from "@/components/ResultPanel";
import { MapPanel } from "@/components/MapPanel";

// This is now a presentational component. All logic is in MobileLayout.
export default function MapPage(props: any) {
    const {
        session, loading, restaurantList, blacklistExcludedCount, displayedSortOrder, selectedItemId, setSelectedItemId,
        subscribedTagIds, isFavorite, isBlacklisted, toggleFavorite, toggleBlacklist, setTaggingRestaurant,
        userLocation, handleSearchInArea, handleAddressSearch, setIsMapReady
    } = props;

    return (
        <div className="h-full w-full flex flex-col">
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
            <div className="h-2/5 flex flex-col">
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