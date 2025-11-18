// src/app/restaurants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPanel } from '@/components/MapPanel';
import { RestaurantInfoPanel } from '@/components/RestaurantInfoPanel';
import { ReviewSection } from '@/components/ReviewSection';
import { AppHeader } from '@/components/AppHeader'; // Import AppHeader
import { VoteType } from '@prisma/client';
import { toast } from "sonner";
import { useAppStore } from '@/store/useAppStore';
import { useFavorites } from '@/hooks/useFavorites'; // Missing import
import { useBlacklist } from '@/hooks/useBlacklist'; // Missing import

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurant, setRestaurant] = useState<AppRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [mapAccordionValue, setMapAccordionValue] = useState<string>('map');

  const { setTaggingRestaurant } = useAppStore();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isBlacklisted, toggleBlacklist } = useBlacklist();

  const totalVotes = (restaurant?.likeCount ?? 0) + (restaurant?.dislikeCount ?? 0);
  const likePercentage = totalVotes > 0 
    ? Math.round(((restaurant?.likeCount ?? 0) / totalVotes) * 100) 
    : null;

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          router.push('/');
          return;
        }
        const data = await response.json();
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id, router]);

  const handleVote = async (voteType: VoteType) => {
    if (!session || isVoting || !restaurant?.dbId) return;
    
    setIsVoting(true);
    const originalRestaurant = restaurant;

    setRestaurant(prev => {
        if (!prev) return null;
        const currentVote = prev.currentUserVote;
        let likeIncrement = 0;
        let dislikeIncrement = 0;
        let nextVote: VoteType | null = null;

        if (currentVote === voteType) {
            if (voteType === 'UPVOTE') likeIncrement = -1;
            else dislikeIncrement = -1;
            nextVote = null;
        } else {
            if (currentVote === 'UPVOTE') likeIncrement = -1;
            if (currentVote === 'DOWNVOTE') dislikeIncrement = -1;
            if (voteType === 'UPVOTE') likeIncrement += 1;
            else dislikeIncrement += 1;
            nextVote = voteType;
        }

        return {
            ...prev,
            likeCount: (prev.likeCount ?? 0) + likeIncrement,
            dislikeCount: (prev.dislikeCount ?? 0) + dislikeIncrement,
            currentUserVote: nextVote,
        };
    });

    try {
      const response = await fetch(`/api/restaurants/${restaurant.dbId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) throw new Error('Vote failed');
      
      const updatedData = await response.json();
      setRestaurant(prev => prev ? {
          ...prev,
          likeCount: updatedData.likeCount,
          dislikeCount: updatedData.dislikeCount,
          currentUserVote: updatedData.currentUserVote,
      } : null);

    } catch (error) {
      setRestaurant(originalRestaurant);
      toast.error('투표 처리에 실패했습니다.');
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
        <main className="w-full min-h-screen p-4 md:p-8">
            <Skeleton className="h-10 w-28 mb-4" />
            <Card><CardHeader><Skeleton className="h-12 w-1/2" /></CardHeader><CardContent><div className="flex flex-col md:flex-row gap-8"><div className="w-full md:w-1/2"><Skeleton className="h-[500px] w-full" /></div><div className="w-full md:w-1/2 space-y-6"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-10 w-full" /></div></div></CardContent></Card>
        </main>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <main className="w-full min-h-screen p-4 md:p-8 relative bg-card">
        <AppHeader />
        <div className="w-full max-w-7xl mx-auto">
            <div className="px-6 pt-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 w-fit p-0 h-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    뒤로가기
                </Button>
                <h1 className="text-4xl font-bold">{restaurant.placeName}</h1>
            </div>
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 flex flex-col gap-8">
                        <Accordion type="single" collapsible value={mapAccordionValue} onValueChange={(value) => setMapAccordionValue(value || '')}>
                            <AccordionItem value="map">
                                <AccordionTrigger className="text-lg font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md w-full justify-between hover:no-underline">
                                    {mapAccordionValue === 'map' ? '지도 숨기기' : '지도 보기'}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="aspect-video w-full">
                                        <MapPanel 
                                            restaurants={[restaurant]}
                                            selectedRestaurant={restaurant}
                                            userLocation={null}
                                            onSearchInArea={() => {}}
                                            onAddressSearch={() => {}}
                                            showSearchBar={false}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <div className="w-full">
                            
                            {restaurant.dbId ? (
                                <ReviewSection restaurantId={restaurant.dbId} />
                            ) : (
                                <div className="p-8 border rounded-lg text-center text-gray-500">
                                    <p>리뷰를 불러올 수 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-1/2">
                        <RestaurantInfoPanel 
                            restaurant={restaurant} 
                            session={session}
                            isFavorite={isFavorite}
                            isBlacklisted={isBlacklisted}
                            onToggleFavorite={toggleFavorite}
                            onToggleBlacklist={toggleBlacklist}
                            onTagManagement={setTaggingRestaurant}
                            likeCount={restaurant.likeCount}
                            dislikeCount={restaurant.dislikeCount}
                            likePercentage={likePercentage}
                            currentUserVote={restaurant.currentUserVote}
                            onVote={handleVote}
                            isVoting={isVoting}
                        />
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}