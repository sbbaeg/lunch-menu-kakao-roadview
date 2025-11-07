'use client';

import React, { useEffect, useState } from 'react';
import { Badge as BadgeType } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { CheckCircle } from 'lucide-react';

const MAX_FEATURED_BADGES = 5;

interface BadgeManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const badgeRequirements: { [key: string]: { stat: keyof UserStats; threshold: number } } = {
  '첫 발자국': { stat: 'reviewCount', threshold: 1 },
  '리뷰어': { stat: 'reviewCount', threshold: 10 },
  '프로 리뷰어': { stat: 'reviewCount', threshold: 50 },
  '태그 개척자': { stat: 'tagCount', threshold: 1 },
  '태그 전문가': { stat: 'tagCount', threshold: 10 },
  '태그 장인': { stat: 'tagCount', threshold: 50 },
  '운명론자': { stat: 'rouletteSpins', threshold: 10 },
  '운명의 탐구자': { stat: 'rouletteSpins', threshold: 50 },
  '운명의 지배자': { stat: 'rouletteSpins', threshold: 200 },
  '주목받는 리뷰': { stat: 'mostUpvotedReview', threshold: 10 },
  '베스트 리뷰': { stat: 'mostUpvotedReview', threshold: 50 },
  '명예의 전당': { stat: 'mostUpvotedReview', threshold: 100 },
  '주목받는 태그': { stat: 'mostSubscribedTag', threshold: 10 },
  '유명 태그': { stat: 'mostSubscribedTag', threshold: 25 },
  '인기 태그 마스터': { stat: 'mostSubscribedTag', threshold: 50 },
  '탐험가': { stat: 'tagSubscriptionCount', threshold: 10 },
  '큐레이터': { stat: 'tagSubscriptionCount', threshold: 50 },
  '지식의 보고': { stat: 'tagSubscriptionCount', threshold: 150 },
  '골드 콜렉터': { stat: 'goldBadgesCount', threshold: 1 },
  '골드 헌터': { stat: 'goldBadgesCount', threshold: 3 },
  '그랜드 마스터': { stat: 'goldBadgesCount', threshold: 7 },
};

interface UserStats {
  reviewCount: number;
  tagCount: number;
  rouletteSpins: number;
  mostUpvotedReview: number;
  mostSubscribedTag: number;
  tagSubscriptionCount: number;
  goldBadgesCount: number;
}

export default function BadgeManagementDialog({ isOpen, onOpenChange }: BadgeManagementDialogProps) {
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [myBadges, setMyBadges] = useState<(BadgeType & { isFeatured: boolean })[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [allBadgesRes, myBadgesRes] = await Promise.all([
            fetch('/api/badges'),
            fetch('/api/users/me/badges'),
          ]);

          if (!allBadgesRes.ok || !myBadgesRes.ok) {
            throw new Error('Failed to fetch badge data');
          }

          const allBadgesData: BadgeType[] = await allBadgesRes.json();
          const myBadgesData: (BadgeType & { isFeatured: boolean })[] = await myBadgesRes.json();

          setAllBadges(allBadgesData);
          setMyBadges(myBadgesData);
          setSelectedBadgeIds(new Set(myBadgesData.filter(b => b.isFeatured).map(b => b.id)));

          // Fetch user stats, but don't block the dialog if it fails
          try {
            const userStatsRes = await fetch('/api/users/me/stats');
            if (userStatsRes.ok) {
              const userStatsData: UserStats = await userStatsRes.json();
              setUserStats(userStatsData);
            }
          } catch (statsError) {
            console.error("Could not fetch user stats:", statsError);
          }

        } catch (error) {
          console.error("Error fetching badge data:", error);
          toast.error("뱃지 정보를 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSelectBadge = (badgeId: number) => {
    const newSelection = new Set(selectedBadgeIds);
    if (newSelection.has(badgeId)) {
      newSelection.delete(badgeId);
    } else {
      if (newSelection.size >= MAX_FEATURED_BADGES) {
        toast.info(`대표 뱃지는 최대 ${MAX_FEATURED_BADGES}개까지 선택할 수 있습니다.`);
        return;
      }
      newSelection.add(badgeId);
    }
    setSelectedBadgeIds(newSelection);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/me/badges/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeIds: Array.from(selectedBadgeIds) }),
      });

      if (!response.ok) {
        throw new Error('Failed to save featured badges');
      }

      toast.success("대표 뱃지가 저장되었습니다.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving featured badges:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const myBadgeIds = new Set(myBadges.map(b => b.id));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>내 뱃지 관리</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">획득한 뱃지 중 프로필에 표시할 대표 뱃지를 최대 {MAX_FEATURED_BADGES}개까지 선택하세요.</p>
        <ScrollArea className="h-[50vh] pr-4 my-4">
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-16 w-16 rounded-md" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {allBadges.map(badge => {
                const isEarned = myBadgeIds.has(badge.id);
                const isSelected = selectedBadgeIds.has(badge.id);

                return (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`relative p-2 border rounded-md aspect-square flex items-center justify-center transition-all ${isEarned ? 'cursor-pointer hover:border-primary' : 'opacity-30'} ${isSelected ? 'border-primary border-2' : ''}`}
                          onClick={() => isEarned && handleSelectBadge(badge.id)}
                        >
                          <div className="relative w-full h-full">
                             <Image 
                                src={badge.iconUrl} 
                                alt={badge.name} 
                                fill 
                                sizes="15vw"
                                style={{ objectFit: 'contain' }}
                              />
                          </div>
                          {isSelected && <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-primary-foreground bg-primary rounded-full" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className={`font-semibold ${isEarned ? '' : 'line-through'}`}>{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        {userStats && badgeRequirements[badge.name] && (
                          <p className="text-sm font-bold text-primary">
                            {`(${(userStats as any)[badgeRequirements[badge.name].stat]} / ${badgeRequirements[badge.name].threshold})`}
                          </p>
                        )}
                        {!isEarned && <p className="text-xs text-amber-500 mt-1">미획득</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
