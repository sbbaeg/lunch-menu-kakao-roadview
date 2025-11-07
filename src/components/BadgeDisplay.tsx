'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge as BadgeType } from '@prisma/client';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';

interface BadgeDisplayProps {
  userId: string;
}

interface DisplayBadge extends BadgeType {
  isFeatured: boolean;
}

export default function BadgeDisplay({ userId }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<DisplayBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

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
        const data: DisplayBadge[] = await response.json();
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

  const featuredBadges = badges.filter(b => b.isFeatured);

  if (featuredBadges.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">대표 뱃지를 설정해보세요.</p>;
  }

    return (

      <div className="mt-4 px-4">

        

        <div className="flex flex-wrap gap-2 items-center">

          {featuredBadges.map((badge) => {

            const BadgeContent = (

              <div className="flex items-center gap-2">

                <div className="relative h-12 w-12 flex-shrink-0">

                  <Image src={badge.iconUrl} alt={badge.name} fill sizes="48px" style={{ objectFit: 'contain' }} />

                </div>

                <div>

                  <p className="font-semibold">{badge.name}</p>

                  <p className="text-sm text-muted-foreground">{badge.description}</p>

                </div>

              </div>

            );

  

            const BadgeTrigger = (

              <div className="relative h-10 w-10 flex-shrink-0">

                <Image 

                  src={badge.iconUrl} 

                  alt={badge.name} 

                  fill 

                  sizes="10vw"

                  style={{ objectFit: 'contain' }}

                />

              </div>

            );

  

            if (isMobile) {

              return (

                <Popover key={badge.id}>

                  <PopoverTrigger asChild>

                    {BadgeTrigger}

                  </PopoverTrigger>

                  <PopoverContent className="w-80">

                    {BadgeContent}

                  </PopoverContent>

                </Popover>

              );

            }

  

            return (

              <TooltipProvider key={badge.id}>

                <Tooltip>

                  <TooltipTrigger asChild>

                    {BadgeTrigger}

                  </TooltipTrigger>

                  <TooltipContent>

                    {BadgeContent}

                  </TooltipContent>

                </Tooltip>

              </TooltipProvider>

            );

          })}

          {badges.length > featuredBadges.length && (

            <Dialog>

              <DialogTrigger asChild>

                <Button variant="ghost" size="sm" className="text-sm">+{badges.length - featuredBadges.length} 더보기</Button>

              </DialogTrigger>

              <DialogContent className="max-w-md">

                <DialogHeader>

                  <DialogTitle>획득한 모든 뱃지</DialogTitle>

                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">

                  <div className="flex flex-wrap gap-3">

                    {badges.map((badge) => {

                      const AllBadgeContent = (

                        <div className="flex items-center gap-2">

                          <div className="relative h-12 w-12 flex-shrink-0">

                            <Image src={badge.iconUrl} alt={badge.name} fill sizes="48px" style={{ objectFit: 'contain' }} />

                          </div>

                          <div>

                            <p className="font-semibold">{badge.name}</p>

                            <p className="text-sm text-muted-foreground">{badge.description}</p>

                          </div>

                        </div>

                      );

  

                      const AllBadgeTrigger = (

                        <div className="relative h-12 w-12 flex-shrink-0">

                          <Image 

                            src={badge.iconUrl} 

                            alt={badge.name} 

                            fill 

                            sizes="10vw"

                            style={{ objectFit: 'contain' }}

                          />

                        </div>

                      );

  

                      if (isMobile) {

                        return (

                          <Popover key={badge.id}>

                            <PopoverTrigger asChild>

                              {AllBadgeTrigger}

                            </PopoverTrigger>

                            <PopoverContent className="w-80">

                              {AllBadgeContent}

                            </PopoverContent>

                          </Popover>

                        );

                      }

  

                      return (

                        <TooltipProvider key={badge.id}>

                          <Tooltip>

                            <TooltipTrigger asChild>

                              {AllBadgeTrigger}

                            </TooltipTrigger>

                            <TooltipContent>

                              {AllBadgeContent}

                            </TooltipContent>

                          </Tooltip>

                        </TooltipProvider>

                      );

                    })}

                  </div>

                </ScrollArea>

              </DialogContent>

            </Dialog>

          )}

        </div>

      </div>

    );
}