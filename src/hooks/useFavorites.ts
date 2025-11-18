import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { toast } from "@/components/ui/toast";

export function useFavorites() {
    const { status } = useSession();
    const [favorites, setFavorites] = useState<AppRestaurant[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const loadFavorites = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/favorites');
                    if (response.ok) {
                        const dbFavorites = await response.json();
                        setFavorites(dbFavorites);
                    }
                } catch (error) {
                    console.error('즐겨찾기 로딩 중 오류:', error);
                }
            } else if (status === 'unauthenticated') {
                const localFavorites = localStorage.getItem('favoriteRestaurants');
                if (localFavorites) {
                    setFavorites(JSON.parse(localFavorites));
                } else {
                    setFavorites([]);
                }
            }
        };
        if (isMounted) {
            loadFavorites();
        }
    }, [status, isMounted]);

    // page.tsx에 있던 isFavorite 함수
    const isFavorite = (placeId: string) => favorites.some((fav) => fav.id === placeId);

    // page.tsx에 있던 toggleFavorite 함수
    const toggleFavorite = async (place: AppRestaurant) => {
        const isCurrentlyFavorite = isFavorite(place.id);
        // 낙관적 업데이트를 위해 현재 상태를 미리 저장
        const originalFavorites = favorites;

        const newFavorites = isCurrentlyFavorite
            ? favorites.filter((fav) => fav.id !== place.id)
            : [...favorites, place];
        setFavorites(newFavorites);

        if (status === 'authenticated') {
            try {
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(place),
                });
                if (!response.ok) {
                    setFavorites(originalFavorites); // 실패 시 롤백
                    toast({
                        variant: "destructive",
                        description: "즐겨찾기 처리에 실패했습니다.",
                    });
                }
            } catch (error) {
                setFavorites(originalFavorites); // 실패 시 롤백
                toast({
                    variant: "destructive",
                    description: "즐겨찾기 처리에 실패했습니다.",
                });
            }
        } else {
            localStorage.setItem('favoriteRestaurants', JSON.stringify(newFavorites));
        }
    };

    const updateFavoriteInList = (updatedRestaurant: AppRestaurant) => {
        setFavorites(prevList => 
            prevList.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
        );
    };

    return { favorites, isFavorite, toggleFavorite, updateFavoriteInList };
}