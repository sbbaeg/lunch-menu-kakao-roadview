'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge as BadgeType } from '@prisma/client';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BadgeDisplayProps {
  userId: string;
}

export default function BadgeDisplay({ userId }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/me/badges`);
        if (!response.ok) {
          throw new Error(`Failed to fetch badges: ${response.statusText}`);
        }
        const data: BadgeType[] = await response.json();
        setBadges(data);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setError("뱃지를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 mt-2">Error: {error}</p>;
  }

  if (badges.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">아직 획득한 뱃지가 없습니다.</p>;
  }

  const displayedBadges = badges.slice(0, 5);

  return (
    <div className="mt-4 px-4">
      
      <div className="flex flex-wrap gap-2 items-center">
        {displayedBadges.map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-8 w-8 flex-shrink-0">
                  <Image 
                    src={badge.iconUrl} 
                    alt={badge.name} 
                    fill 
                    sizes="10vw"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {badges.length > 5 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm">+{badges.length - 5} 더보기</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>획득한 모든 뱃지</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-4">
                <div className="flex flex-wrap gap-3">
                  {badges.map((badge) => (
                    <TooltipProvider key={badge.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative h-10 w-10 flex-shrink-0">
                            <Image 
                              src={badge.iconUrl} 
                              alt={badge.name} 
                              fill 
                              sizes="10vw"
                              style={{ objectFit: 'contain' }}
                            />
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
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}