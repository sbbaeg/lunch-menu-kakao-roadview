// src/components/TagReviewForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppTagReview } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/toast";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TagReviewFormProps {
  tagId: number;
  existingReview?: AppTagReview | null;
  onReviewSubmit: () => void; // To refresh the list after submission
  onCancelEdit?: () => void;
  isBanned: boolean;
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

export function TagReviewForm({ tagId, existingReview, onReviewSubmit, onCancelEdit, isBanned }: TagReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [text, setText] = useState(existingReview?.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // If the user starts editing another review, reset the form
  useEffect(() => {
    setRating(existingReview?.rating || 0);
    setText(existingReview?.text || '');
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('별점을 선택해주세요.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tags/${tagId}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) { // Banned user error
          toast.error("작성 제한", {
            description: "차단된 사용자는 리뷰를 작성할 수 없습니다.",
          });
        } else {
          throw new Error(errorData.error || 'Failed to submit review');
        }
      } else {
        onReviewSubmit(); // Refresh the reviews list
        if (existingReview) {
          onCancelEdit?.(); // Exit edit mode
        } else {
          // Reset form after new submission
          setRating(0);
          setText('');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('리뷰를 등록하는 데 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BannedFeedbackButton = () => {
    if (isDesktop) {
      return (
        <Button type="button" disabled>
          차단된 사용자
        </Button>
      );
    }

    // Mobile
    return (
      <Button
        type="button"
        aria-disabled="true"
        className="opacity-50 cursor-not-allowed"
        onClick={() => {
          toast.error("작성 제한", {
            description: "차단된 사용자는 리뷰를 작성할 수 없습니다.",
          });
        }}
      >
        {existingReview ? '수정하기' : '작성하기'}
      </Button>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold text-lg">{existingReview ? '태그 리뷰 수정하기' : '태그 리뷰 작성하기'}</h3>
      <div className="space-y-2">
        <p className="text-sm font-medium">평점</p>
        <StarInput rating={rating} setRating={setRating} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">내용</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="이 태그가 유용했는지, 어떤 점이 좋았는지 등 자유롭게 의견을 남겨주세요."
          rows={4}
          disabled={isBanned}
        />
      </div>
      <div className="flex justify-end gap-2">
        {existingReview && (
          <Button type="button" variant="ghost" onClick={onCancelEdit} disabled={isSubmitting}>
            취소
          </Button>
        )}
        {isBanned ? (
          <BannedFeedbackButton />
        ) : (
          <Button type="submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingReview ? '수정하기' : '작성하기'}
          </Button>
        )}
      </div>
    </form>
  );
}