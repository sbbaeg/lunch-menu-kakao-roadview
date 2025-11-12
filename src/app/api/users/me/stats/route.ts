// src/app/api/users/me/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const reviewCount = await prisma.review.count({ where: { userId } });
    const tagCount = await prisma.tag.count({ where: { userId } });
    const rouletteSpins = user?.rouletteSpins || 0;

    const mostUpvotedReview = await prisma.review.findFirst({
      where: { userId },
      include: { _count: { select: { votes: { where: { type: 'UPVOTE' } } } } },
      orderBy: { votes: { _count: 'desc' } },
    });

    const mostSubscribedTag = await prisma.tag.findFirst({
        where: { userId },
        include: { _count: { select: { subscribers: true } } },
        orderBy: { subscribers: { _count: 'desc' } },
    });

    const tagSubscriptionCount = await prisma.tagSubscription.count({ where: { userId } });

    const goldBadgesCount = await prisma.userBadge.count({
        where: { userId, badge: { tier: 'GOLD' } },
    });

    const stats = {
      reviewCount,
      tagCount,
      rouletteSpins,
      mostUpvotedReview: mostUpvotedReview?._count.votes || 0,
      mostSubscribedTag: mostSubscribedTag?._count.subscribers || 0,
      tagSubscriptionCount,
      goldBadgesCount,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
