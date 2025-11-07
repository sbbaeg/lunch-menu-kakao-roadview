// src/components/ReviewCard.tsx
"use client";

import { useState } from 'react';
import { AppReview } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { ThumbsUp, ThumbsDown, Edit, Trash2, Flag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { VoteType } from '@prisma/client';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReviewCardProps {
  review: AppReview;
  isBestReview?: boolean;
  onVote: (reviewId: number, voteType: VoteType) => Promise<void>;
  onDelete: (reviewId: number) => Promise<void>;
  onEdit: (review: AppReview) => void;
}

export function ReviewCard({ review, isBestReview = false, onVote, onDelete, onEdit }: ReviewCardProps) {
  const { data: session } = useSession();
  const isAuthor = session?.user?.id === review.userId;

  // Optimistic UI updates for votes
  const [localUpvotes, setLocalUpvotes] = useState(review.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(review.downvotes);
  const [localUserVote, setLocalUserVote] = useState(review.currentUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const [isReporting, setIsReporting] = useState(false);

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

  const handleReport = async () => {
    if (!session || isAuthor || isReporting) return;
    
    if (confirm('이 리뷰를 부적절한 내용으로 신고하시겠습니까?')) {
      setIsReporting(true);
      try {
        const response = await fetch(`/api/reviews/${review.id}/report`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to report');
        }
        
        alert('신고가 접수되었습니다. 관리자 검토 후 조치될 예정입니다.');
        // (신고 버튼을 숨기거나 비활성화 처리도 가능)
      
      } catch (error) {
        console.error("Failed to report review:", error);
        alert('신고 처리에 실패했습니다.');
      } finally {
        setIsReporting(false);
      }
    }
  };

  return (
    <div className={`p-4 border-b last:border-b-0 relative rounded-md ${isBestReview ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
      {isBestReview && (
        <Badge variant="destructive" className="absolute -top-2 -left-2 -rotate-12 z-10">
          BEST
        </Badge>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.user.image || undefined} alt={review.user.name || 'User'} />
            <AvatarFallback>{review.user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{review.user.name}</p>
              <div className="flex gap-1">
                {review.user.featuredBadges?.map(badge => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="relative h-5 w-5">
                          <Image src={badge.iconUrl} alt={badge.name} fill sizes="20px" style={{ objectFit: 'contain' }} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
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
          <span>{localUpvotes}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote('DOWNVOTE')}
          disabled={!session || isAuthor || isVoting}
          className={`gap-1 ${localUserVote === 'DOWNVOTE' ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}>
          <ThumbsDown className="h-4 w-4" />
          <span>{localDownvotes}</span>
        </Button>
        <div className="flex-grow" /> {/* 버튼을 오른쪽으로 밀기 */}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={!session || isAuthor || isReporting}
          className="text-muted-foreground hover:text-destructive gap-1"
        >
          <Flag className="h-4 w-4" />
          {isReporting ? '신고 중...' : '신고'}
        </Button>
      </div>
    </div>
  );
}
