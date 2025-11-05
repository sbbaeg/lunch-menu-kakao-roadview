// src/components/TagReviewSection.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AppTagReview } from '@/lib/types';
import { TagReviewCard } from './TagReviewCard'; // To be created
import { TagReviewForm } from './TagReviewForm'; // To be created
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface TagReviewSectionProps {
  tagId: number;
}

type SortOrder = 'latest' | 'rating_desc' | 'rating_asc';

export function TagReviewSection({ tagId }: TagReviewSectionProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<AppTagReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [editingReview, setEditingReview] = useState<AppTagReview | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tags/${tagId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      }
    } catch (error) {
      console.error("Failed to fetch tag reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tagId) {
      fetchReviews();
    }
  }, [tagId]);

  const handleDelete = async (reviewId: number) => {
    // This needs a new API endpoint: /api/tags/[tagId]/reviews/[reviewId]
    alert('Delete functionality to be implemented');
  };

  const displayReviews = useMemo(() => {
    const sortedReviews = [...reviews];
    switch (sortOrder) {
      case 'rating_desc':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_asc':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'latest':
      default:
        sortedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return sortedReviews;
  }, [reviews, sortOrder]);

  const myReview = useMemo(() => {
    if (session?.user) {
      return reviews.find(r => r.userId === session.user.id) || null;
    }
    return null;
  }, [reviews, session]);

  const showNewReviewForm = status === 'authenticated' && !myReview && !editingReview;

  if (isLoading) {
    return <div>태그 리뷰를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold">태그 리뷰 및 평점</h2>
      {(editingReview || showNewReviewForm) && (
        <TagReviewForm 
          tagId={tagId} 
          existingReview={editingReview}
          onReviewSubmit={() => { setEditingReview(null); fetchReviews(); }}
          onCancelEdit={() => setEditingReview(null)}
          isBanned={session?.user?.isBanned ?? false}
        />
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">전체 리뷰 ({reviewCount}개)</h3>
          <div className="flex items-center gap-4">
            <p>평균 평점: <span className="font-bold">{averageRating.toFixed(1)}</span> / 5.0</p>
            <Select onValueChange={(value: SortOrder) => setSortOrder(value)} defaultValue="latest">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="rating_desc">높은 평점순</SelectItem>
                <SelectItem value="rating_asc">낮은 평점순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />
        {displayReviews.length > 0 ? (
          <div className="space-y-2">
            {displayReviews.map(review => (
              <TagReviewCard 
                key={review.id} 
                review={review} 
                onDelete={handleDelete} 
                onEdit={setEditingReview} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>아직 작성된 리뷰가 없습니다. 이 태그에 대한 첫 리뷰를 남겨보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}