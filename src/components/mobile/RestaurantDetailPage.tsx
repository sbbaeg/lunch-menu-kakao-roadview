'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map, Heart, EyeOff, Tags, ThumbsUp, ThumbsDown } from 'lucide-react'; 
import { VoteType } from '@prisma/client';
import { RestaurantDetails } from '@/components/RestaurantDetails';
import { ReviewSection } from '@/components/ReviewSection';
import { MapPanel } from '@/components/MapPanel';
import { useKakaoMap } from '@/hooks/useKakaoMap';

interface RestaurantDetailPageProps {
    isFavorite: (id: string) => boolean;
    isBlacklisted: (id: string) => boolean;
    onToggleFavorite: (restaurant: AppRestaurant) => void;
    onToggleBlacklist: (restaurant: AppRestaurant) => void;
    onTagManagement: (restaurant: AppRestaurant | null) => void;
}

export default function RestaurantDetailPage({
    isFavorite,
    isBlacklisted,
    onToggleFavorite,
    onToggleBlacklist,
    onTagManagement
}: RestaurantDetailPageProps) {
    const { data: session } = useSession();
    const activeRestaurantId = useAppStore(state => state.activeRestaurantId);
    const goBack = useAppStore(state => state.goBack)

    const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);

    // --- 좋아요/싫어요 로직 추가 ---
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [localDislikeCount, setLocalDislikeCount] = useState(0);
    const [currentUserVote, setCurrentUserVote] = useState<VoteType | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    const totalVotes = localLikeCount + localDislikeCount;
    const likePercentage = totalVotes > 0 
        ? Math.round((localLikeCount / totalVotes) * 100) 
        : null;

    useEffect(() => {
        if (restaurant) {
            setLocalLikeCount(restaurant.likeCount ?? 0);
            setLocalDislikeCount(restaurant.dislikeCount ?? 0);
            // `restaurant` 객체에 현재 사용자 투표 정보(currentUserVote)가 포함되어 있다고 가정
            // setCurrentUserVote(restaurant.currentUserVote ?? null);
        }
    }, [restaurant]);

    const handleVote = async (voteType: VoteType) => {
        if (!session || isVoting || !restaurant?.dbId) return;
        setIsVoting(true);

        const originalState = { likes: localLikeCount, dislikes: localDislikeCount, vote: currentUserVote };

        let likeIncrement = 0;
        let dislikeIncrement = 0;
        let nextVote: VoteType | null = null;

        if (currentUserVote === voteType) { // 투표 취소
            if (voteType === 'UPVOTE') likeIncrement = -1; else dislikeIncrement = -1;
            nextVote = null;
        } else { // 신규 또는 변경
            if (currentUserVote === 'UPVOTE') likeIncrement = -1;
            if (currentUserVote === 'DOWNVOTE') dislikeIncrement = -1;
            if (voteType === 'UPVOTE') likeIncrement = 1; else dislikeIncrement = 1;
            nextVote = voteType;
        }
        setLocalLikeCount(c => c + likeIncrement);
        setLocalDislikeCount(c => c + dislikeIncrement);
        setCurrentUserVote(nextVote);

        try {
            const response = await fetch(`/api/restaurants/${restaurant.dbId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voteType }),
            });
            if (!response.ok) throw new Error('Vote failed');
        } catch (error) {
            setLocalLikeCount(originalState.likes);
            setLocalDislikeCount(originalState.dislikes);
            setCurrentUserVote(originalState.vote);
            alert('투표 처리에 실패했습니다.');
        } finally {
            setIsVoting(false);
        }
    };

    useEffect(() => {
        if (activeRestaurantId) {
            const fetchRestaurantData = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/restaurants/${activeRestaurantId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || '음식점 정보를 불러오는데 실패했습니다.');
                    }
                    const data = await response.json();
                    setRestaurant(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchRestaurantData();
        }
    }, [activeRestaurantId]);

    const handleTagClick = () => {
        if (session && restaurant) {
            onTagManagement(restaurant);
        } else if (!session) {
            alert('로그인이 필요한 기능입니다.');
        }
    };

    const handleFavoriteClick = () => {
        if (session && restaurant) {
            onToggleFavorite(restaurant);
        } else if (!session) {
            alert('로그인이 필요한 기능입니다.');
        }
    };

    const handleBlacklistClick = () => {
        if (session && restaurant) {
            onToggleBlacklist(restaurant);
        } else if (!session) {
            alert('로그인이 필요한 기능입니다.');
        }
    };

    if (loading) {
        return (
            <div className="p-4 h-full space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <div className="space-y-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-4 w-1/Try" />
                <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                 <Button variant="ghost" onClick={goBack} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={goBack} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div>음식점을 찾을 수 없습니다.</div>
            </div>
        );
    }
    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex-shrink-0 mb-4">
                <Button variant="ghost" onClick={goBack} className="w-fit p-0 h-auto text-muted-foreground mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{restaurant.placeName}</h1>
                    <Button variant="outline" size="sm" onClick={() => setIsMapVisible(prev => !prev)}>
                        <Map className="mr-2 h-4 w-4" />
                        {isMapVisible ? '지도 숨기기' : '지도 보기'}
                    </Button>
                </div>
            </header>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMapVisible ? 'h-64' : 'h-0'}`}>
                {isMapVisible && restaurant && (
                    <MapPanel
                        restaurants={[restaurant]}
                        selectedRestaurant={restaurant}
                        userLocation={null}
                        onSearchInArea={() => {}}
                        onAddressSearch={() => {}}
                        showSearchBar={false}
                        hideControls={false}
                    />
                )}
            </div>
            <div className="flex items-center gap-2 mb-3 px-1 pt-4">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleTagClick}
                    disabled={!session}
                >
                    <Tags className="h-4 w-4 mr-2" />
                    태그
                </Button>
                <Button 
                    variant={isBlacklisted(restaurant.id) ? "destructive" : "outline"}
                    size="sm" 
                    className="flex-1"
                    onClick={handleBlacklistClick}
                    disabled={!session}
                >
                    <EyeOff className="h-4 w-4 mr-2" />
                    블랙리스트
                </Button>
                <Button 
                    variant={isFavorite(restaurant.id) ? "default" : "outline"}
                    size="sm" 
                    className="flex-1"
                    onClick={handleFavoriteClick}
                    disabled={!session}
                >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite(restaurant.id) ? 'fill-current' : ''}`} />
                    즐겨찾기
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border">
                                    <RestaurantDetails 
                                        restaurant={restaurant} 
                                        session={session}
                                        hideViewDetailsButton={true}
                                    />
                                    {/* 좋아요/싫어요 섹션 */}
                                    <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t">
                                        {/* 왼쪽: 통계 표시 */}
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        {likePercentage !== null ? (
                                            <>
                                            <div className="flex items-center gap-1" title="좋아요 비율">
                                                <ThumbsUp className="h-4 w-4 text-sky-500" />
                                                <span className="font-medium text-foreground">{likePercentage}%</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs" title="좋아요 수">
                                                <ThumbsUp className="h-3 w-3" /> {localLikeCount}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs" title="싫어요 수">
                                                <ThumbsDown className="h-3 w-3" /> {localDislikeCount}
                                            </div>
                                            </>
                                        ) : (
                                            <span className="text-xs">아직 평가가 없습니다.</span>
                                        )}
                                        </div>
                    
                                        {/* 오른쪽: 투표 버튼 */}
                                        <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleVote('UPVOTE')}
                                            disabled={!session || isVoting}
                                            className={`gap-1 ${currentUserVote === 'UPVOTE' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleVote('DOWNVOTE')}
                                            disabled={!session || isVoting}
                                            className={`gap-1 ${currentUserVote === 'DOWNVOTE' ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                        </Button>
                                        </div>
                                    </div>
                                </div>                {restaurant.dbId ? (
                    <ReviewSection restaurantId={restaurant.dbId} />
                ) : (
                    <p className="text-center text-muted-foreground">리뷰를 불러올 수 없습니다.</p>
                )}
            </div>
        </div>
    );
}