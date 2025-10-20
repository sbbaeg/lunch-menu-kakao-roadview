// src/components/ReviewForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppReview } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  restaurantId: number;
  existingReview?: AppReview | null;
  onReviewSubmit: () => void; // To refresh the list after submission
  onCancelEdit?: () => void;
}

// A simple star component for the form
const StarInput = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className={`text-3xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>
          ★
        </button>
      ))}
    </div>
  );
};

export function ReviewForm({ restaurantId, existingReview, onReviewSubmit, onCancelEdit }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [text, setText] = useState(existingReview?.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If the user starts editing another review, reset the form
  useEffect(() => {
    setRating(existingReview?.rating || 0);
    setText(existingReview?.text || '');
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      onReviewSubmit(); // Refresh the reviews list
      if (existingReview) {
        onCancelEdit?.(); // Exit edit mode
      } else {
        // Reset form after new submission
        setRating(0);
        setText('');
      }

    } catch (error) {
      console.error(error);
      alert('리뷰를 등록하는 데 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold text-lg">{existingReview ? '리뷰 수정하기' : '리뷰 작성하기'}</h3>
      <div className="space-y-2">
        <p className="text-sm font-medium">별점</p>
        <StarInput rating={rating} setRating={setRating} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">내용</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="음식점에 대한 솔직한 리뷰를 남겨주세요."
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2">
        {existingReview && (
          <Button type="button" variant="ghost" onClick={onCancelEdit} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingReview ? '수정하기' : '작성하기'}
        </Button>
      </div>
    </form>
  );
}
