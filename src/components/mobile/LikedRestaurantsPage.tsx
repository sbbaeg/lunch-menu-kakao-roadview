"use client";

import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RestaurantCard } from "@/components/RestaurantCard";
import { Accordion } from "@/components/ui/accordion";

// This is a presentational component for the Liked Restaurants page.
export default function LikedRestaurantsPage(props: any) {
    const {
        likedRestaurants,
        isLoading,
        session,
        subscribedTagIds,
        selectedItemId,
        setSelectedItemId,
        isFavorite,
        isBlacklisted,
        onToggleFavorite,
        onToggleBlacklist,
        onTagManagement
    } = props;
    const goBack = useAppStore(state => state.goBack);

    return (
        <div className="p-4 h-full flex flex-col bg-card">
            <header className="flex-shrink-0">
                <Button variant="ghost" onClick={goBack} className="w-fit p-0 h-auto text-muted-foreground mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <h1 className="text-2xl font-bold">좋아요한 음식점</h1>
            </header>
            <main className="flex-1 min-h-0 overflow-y-auto p-2 mt-4">
                {isLoading ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>좋아요한 음식점 목록을 불러오는 중...</p>
                    </div>
                ) : likedRestaurants.length > 0 ? (
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        value={selectedItemId}
                        onValueChange={setSelectedItemId}
                    >
                        {likedRestaurants.map((place: any) => (
                            <RestaurantCard
                                key={place.id}
                                restaurant={place}
                                session={session}
                                subscribedTagIds={subscribedTagIds}
                                isFavorite={isFavorite}
                                isBlacklisted={isBlacklisted}
                                onToggleFavorite={onToggleFavorite}
                                onToggleBlacklist={onToggleBlacklist}
                                onTagManagement={onTagManagement}
                            />
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>아직 좋아요한 음식점이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
