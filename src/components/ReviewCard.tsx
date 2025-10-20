// src/components/ReviewCard.tsx
"use client";

import { useState } from 'react';
import { AppReview } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { VoteType } from '@prisma/client';

interface ReviewCardProps {
  review: AppReview;
  onVote: (reviewId: number, voteType: VoteType) => Promise<void>;
  onDelete: (reviewId: number) => Promise<void>;
  onEdit: (review: AppReview) => void;
}

export function ReviewCard({ review, onVote, onDelete, onEdit }: ReviewCardProps) {
  const { data: session } = useSession();
  const isAuthor = session?.user?.id === review.userId;

  // Optimistic UI updates for votes
  const [localUpvotes, setLocalUpvotes] = useState(review.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(review.downvotes);
  const [localUserVote, setLocalUserVote] = useState(review.currentUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: VoteType) => {
    if (!session || isVoting) return;
    setIsVoting(true);

    const originalState = { upvotes: localUpvotes, downvotes: localDownvotes, vote: localUserVote };

    // Optimistic update logic
    setLocalUserVote(prevVote => {
      if (prevVote === voteType) { // Un-voting
        voteType === 'UPVOTE' ? setLocalUpvotes(c => c - 1) : setLocalDownvotes(c => c - 1);
        return null;
      } else { // New vote or changing vote
        if (prevVote === 'UPVOTE') setLocalUpvotes(c => c - 1);
        if (prevVote === 'DOWNVOTE') setLocalDownvotes(c => c - 1);
        voteType === 'UPVOTE' ? setLocalUpvotes(c => c + 1) : setLocalDownvotes(c => c + 1);
        return voteType;
      }
    });

    try {
      await onVote(review.id, voteType);
    } catch (error) {
      // Revert on error
      setLocalUpvotes(originalState.upvotes);
      setLocalDownvotes(originalState.downvotes);
      setLocalUserVote(originalState.vote);
      alert('투표 처리에 실패했습니다.');
    }
    setIsVoting(false);
  };

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.user.image || undefined} alt={review.user.name || 'User'} />
            <AvatarFallback>{review.user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{review.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(review.createdAt), 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        {isAuthor && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(review)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(review.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        <StarRating rating={review.rating} />
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.text}</p>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote('UPVOTE')}
          disabled={!session || isAuthor || isVoting}
          className={`gap-1 ${localUserVote === 'UPVOTE' ? 'bg-primary/10 border-primary text-primary' : ''}`}>
          <ThumbsUp className="h-4 w-4" />
          <span>추천</span>
          <span>{localUpvotes}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote('DOWNVOTE')}
          disabled={!session || isAuthor || isVoting}
          className={`gap-1 ${localUserVote === 'DOWNVOTE' ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}>
          <ThumbsDown className="h-4 w-4" />
          <span>비추천</span>
          <span>{localDownvotes}</span>
        </Button>
      </div>
    </div>
  );
}
