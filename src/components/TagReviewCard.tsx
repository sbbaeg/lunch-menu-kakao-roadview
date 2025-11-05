// src/components/TagReviewCard.tsx
"use client";

import { AppTagReview } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { Edit, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TagReviewCardProps {
  review: AppTagReview;
  onDelete: (reviewId: number) => Promise<void>;
  onEdit: (review: AppTagReview) => void;
}

export function TagReviewCard({ review, onDelete, onEdit }: TagReviewCardProps) {
  const { data: session } = useSession();
  const isAuthor = session?.user?.id === review.userId;

  return (
    <div className={`p-4 border-b last:border-b-0 relative rounded-md`}>
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
    </div>
  );
}