import { awardBadge } from '@/lib/awardBadge';
// src/app/api/users/me/roulette-spin/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAndAwardMasteryBadges } from '@/lib/badgeLogic';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { rouletteSpins: { increment: 1 } },
    });

    const rouletteSpins = updatedUser.rouletteSpins;
    console.log(`[RouletteSpin] Current rouletteSpins for user ${userId}: ${rouletteSpins}`);

    // --- Badge Awarding Logic ---
    const badgeNames: { [key: number]: string } = {
        10: '운명론자',
        50: '운명의 탐구자',
        200: '운명의 지배자',
    };

    if (badgeNames[rouletteSpins]) {
        const badgeName = badgeNames[rouletteSpins];
        await awardBadge(userId, badgeName);
        
        // After awarding, check if it was a GOLD badge to trigger mastery check
        const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
        if (badge && badge.tier === 'GOLD') {
            await checkAndAwardMasteryBadges(userId);
        }
    }
    // --- End of Badge Logic ---

    return NextResponse.json({ success: true, spins: rouletteSpins });
  } catch (error) {
    console.error('Failed to update roulette spins:', error);
    return NextResponse.json({ error: 'Failed to update roulette spins' }, { status: 500 });
  }
}
