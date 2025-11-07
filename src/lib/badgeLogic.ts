// src/lib/badgeLogic.ts
import prisma from '@/lib/prisma';

export async function checkAndAwardMasteryBadges(userId: string) {
  const goldBadgesCount = await prisma.userBadge.count({
    where: {
      userId: userId,
      badge: {
        tier: 'GOLD',
      },
    },
  });

  const masteryBadgeThresholds: { [key: number]: string } = {
    1: '골드 콜렉터',
    3: '골드 헌터',
    7: '그랜드 마스터',
  };

  for (const threshold of Object.keys(masteryBadgeThresholds).map(Number)) {
    if (goldBadgesCount >= threshold) {
        const currentMasteryBadge = await prisma.badge.findUnique({ where: { name: masteryBadgeThresholds[threshold] } });
        if(currentMasteryBadge){
            const hasMasteryBadge = await prisma.userBadge.findFirst({where: {userId, badgeId: currentMasteryBadge.id}})
            if(!hasMasteryBadge){
                await prisma.userBadge.create({data: {userId, badgeId: currentMasteryBadge.id}})
            }
        }
    }
  }
}
