"use client";

import { RestaurantCard } from "@/components/RestaurantCard";
import { Accordion } from "@/components/ui/accordion";

// This is a presentational component for the Favorites tab.
export default function FavoritesPage(props: any) {
    const {
        favorites,
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

    return (
        <div className="h-full w-full flex flex-col">
            <header className="p-4 border-b flex-shrink-0">
                <h1 className="text-2xl font-bold">즐겨찾기</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-2 min-h-0">
                {favorites.length > 0 ? (
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        value={selectedItemId}
                        onValueChange={setSelectedItemId}
                    >
                        {favorites.map((place: any) => (
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
                        <p>아직 즐겨찾기에 등록된 음식점이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
