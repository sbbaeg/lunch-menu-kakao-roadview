// src/app/api/users/me/badges/mark-as-viewed/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Find unread badges to identify which notifications to update
    const unreadUserBadges = await prisma.userBadge.findMany({
      where: {
        userId: userId,
        isViewed: false,
      },
      select: {
        badgeId: true,
      },
    });

    if (unreadUserBadges.length === 0) {
      return NextResponse.json({ count: 0, message: 'No new badges to mark.' });
    }

    const badgeIdsToUpdate = unreadUserBadges.map(ub => ub.badgeId);

    // Use a transaction to ensure both updates succeed or fail together
    const [updateBadgesResult, updateNotificationsResult] = await prisma.$transaction([
      // Mark the badges as viewed
      prisma.userBadge.updateMany({
        where: {
          userId: userId,
          isViewed: false,
        },
        data: {
          isViewed: true,
        },
      }),
      // Mark the related notifications as read
      prisma.notification.updateMany({
        where: {
          userId: userId,
          type: 'NEW_BADGE',
          read: false,
        },
        data: {
          read: true,
        },
      }),
    ]);

    return NextResponse.json({ 
      markedBadges: updateBadgesResult.count,
      markedNotifications: updateNotificationsResult.count 
    });

  } catch (error) {
    console.error('[API Error] Failed to mark badges and notifications as viewed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
