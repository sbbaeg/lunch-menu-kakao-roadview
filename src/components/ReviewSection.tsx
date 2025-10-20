// src/components/ReviewSection.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AppReview } from '@/lib/types';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VoteType } from '@prisma/client';

interface ReviewSectionProps {
  restaurantId: number; // DB auto-increment ID
}

type SortOrder = 'latest' | 'rating_desc' | 'rating_asc' | 'helpful_desc';

export function ReviewSection({ restaurantId }: ReviewSectionProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [editingReview, setEditingReview] = useState<AppReview | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchReviews();
    }
  }, [restaurantId]);

  const handleVote = async (reviewId: number, voteType: VoteType) => {
    await fetch(`/api/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType }),
    });
    // No need to refetch, ReviewCard handles optimistic updates
  };

  const handleDelete = async (reviewId: number) => {
    if (confirm('정말로 리뷰를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
        if (response.ok) {
          fetchReviews(); // Re-fetch to update the list
        } else {
          alert('리뷰 삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('리뷰 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const sortedReviews = useMemo(() => {
    const reviewsCopy = [...reviews];
    switch (sortOrder) {
      case 'rating_desc':
        return reviewsCopy.sort((a, b) => b.rating - a.rating);
      case 'rating_asc':
        return reviewsCopy.sort((a, b) => a.rating - b.rating);
      case 'helpful_desc':
        return reviewsCopy.sort((a, b) => b.upvotes - a.upvotes);
      case 'latest':
      default:
        return reviewsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [reviews, sortOrder]);

  const bestReviewIds = useMemo(() => {
    const ids = [...reviews]
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3)
      .filter(r => r.upvotes > 0)
      .map(r => r.id);
    return new Set(ids);
  }, [reviews]);

  const myReview = useMemo(() => {
    if (session?.user) {
      return reviews.find(r => r.userId === session.user.id) || null;
    }
    return null;
  }, [reviews, session]);

  const showNewReviewForm = status === 'authenticated' && !myReview && !editingReview;

  if (isLoading) {
    return <div>리뷰를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Show form when editing or creating a new review */}
      {(editingReview || showNewReviewForm) && (
        <ReviewForm 
          restaurantId={restaurantId} 
          existingReview={editingReview}
          onReviewSubmit={() => { setEditingReview(null); fetchReviews(); }}
          onCancelEdit={() => setEditingReview(null)}
        />
      )}

      {/* Unified Review List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">전체 리뷰 ({reviews.length}개)</h3>
          <Select onValueChange={(value: SortOrder) => setSortOrder(value)} defaultValue="latest">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="helpful_desc">추천순</SelectItem>
              <SelectItem value="rating_desc">높은 평점순</SelectItem>
              <SelectItem value="rating_asc">낮은 평점순</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        {sortedReviews.length > 0 ? (
          <div className="space-y-2">
            {sortedReviews.map(review => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                isBestReview={bestReviewIds.has(review.id)}
                onVote={handleVote} 
                onDelete={handleDelete} 
                onEdit={setEditingReview} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>아직 작성된 리뷰가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
