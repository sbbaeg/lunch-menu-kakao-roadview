
'use client';

import { useState, useEffect } from 'react';
import { AppRestaurant } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ThumbsUp, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';

function RankingItem({ restaurant, rank }: { restaurant: AppRestaurant; rank: number }) {
    const { isStandalone } = usePwaDisplayMode();
    const showRestaurantDetail = useAppStore((state) => state.showRestaurantDetail);

    const totalVotes = (restaurant.likeCount ?? 0) + (restaurant.dislikeCount ?? 0);
    const likePercentage = totalVotes > 0
        ? Math.round(((restaurant.likeCount ?? 0) / totalVotes) * 100)
        : 0;

    const handleItemClick = (e: React.MouseEvent) => {
        if (isStandalone) {
            e.preventDefault();
            showRestaurantDetail(restaurant.id);
        }
    };

    const rankColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-yellow-600' : 'text-muted-foreground';

    return (
        <Link href={`/restaurants/${restaurant.id}`} onClick={handleItemClick} className="block w-full">
            <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 font-bold text-xl ${rankColor}`}>
                        {rank}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold truncate">{restaurant.placeName}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.categoryName}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-bold text-sky-500">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{likePercentage}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {restaurant.likeCount} / {totalVotes}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function RankingPage() {
    const [rankedRestaurants, setRankedRestaurants] = useState<AppRestaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const goBack = useAppStore((state) => state.goBack);
    const { isStandalone } = usePwaDisplayMode();

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await fetch('/api/restaurants/ranking');
                if (!response.ok) {
                    throw new Error('랭킹 정보를 불러오는 데 실패했습니다.');
                }
                const data = await response.json();
                setRankedRestaurants(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            );
        }

        if (error) {
            return <p className="text-center text-red-500">{error}</p>;
        }

        if (rankedRestaurants.length === 0) {
            return <p className="text-center text-muted-foreground">랭킹 정보가 없습니다.</p>;
        }

        return (
            <div className="space-y-3">
                {rankedRestaurants.map((restaurant, index) => (
                    <RankingItem key={restaurant.id} restaurant={restaurant} rank={index + 1} />
                ))}
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col">
             <header className="p-4 border-b flex-shrink-0 flex items-center gap-4">
                {isStandalone && (
                     <Button variant="ghost" size="icon" onClick={goBack}>
                        <ArrowLeft />
                    </Button>
                )}
                <div className="flex items-center gap-2 text-2xl font-bold">
                    <Trophy className="text-yellow-500" />
                    <h1>음식점 명예의 전당</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 min-h-0">
                {renderContent()}
            </main>
        </div>
    );
}
