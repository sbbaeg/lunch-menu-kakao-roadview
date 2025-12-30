// src/app/api/debug/reset-badges/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // This is a destructive operation. The order is important to avoid relation constraint errors.
    // We delete records that depend on others first.

    // 1. Delete notifications (depend on reviews, tags)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: userId },
    });

    // 2. Delete votes (depend on reviews)
    const deletedReviewVotes = await prisma.reviewVote.deleteMany({
        where: { userId: userId },
    });
    const deletedRestaurantVotes = await prisma.restaurantVote.deleteMany({
        where: { userId: userId },
    });

    // 3. Delete user's content
    const deletedReviews = await prisma.review.deleteMany({
      where: { userId: userId },
    });
    const deletedTags = await prisma.tag.deleteMany({
      where: { userId: userId },
    });
    const deletedTagSubscriptions = await prisma.tagSubscription.deleteMany({
        where: { userId: userId },
    });

    // 4. Delete badge records
    const deletedBadges = await prisma.userBadge.deleteMany({
      where: { userId: userId },
    });

    // 5. Reset counters on the User model
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            rouletteSpins: 0
        }
    });

    const summary = {
        deletedBadges: deletedBadges.count,
        deletedNotifications: deletedNotifications.count,
        deletedReviews: deletedReviews.count,
        deletedTags: deletedTags.count,
        deletedReviewVotes: deletedReviewVotes.count,
        deletedRestaurantVotes: deletedRestaurantVotes.count,
        deletedTagSubscriptions: deletedTagSubscriptions.count,
        resetRouletteSpins: updatedUser.rouletteSpins === 0,
    };

    console.log(`[Debug] Full activity reset for user ${userId}:`, summary);

    return NextResponse.json({ 
      message: `Successfully performed a full activity reset for user ${userId}.`,
      details: summary
    });
  } catch (error) {
    console.error(`[Debug] Error performing full activity reset for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to reset user activity' }, { status: 500 });
  }
}
