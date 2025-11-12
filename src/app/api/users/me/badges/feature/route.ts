// src/app/api/users/me/badges/feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MAX_FEATURED_BADGES = 5;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { badgeIds } = await request.json() as { badgeIds: number[] };

    if (!Array.isArray(badgeIds) || badgeIds.some(id => typeof id !== 'number')) {
      return NextResponse.json({ error: 'Invalid input: badgeIds must be an array of numbers.' }, { status: 400 });
    }

    if (badgeIds.length > MAX_FEATURED_BADGES) {
      return NextResponse.json({ error: `You can feature a maximum of ${MAX_FEATURED_BADGES} badges.` }, { status: 400 });
    }

    const userId = session.user.id;

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Reset all of the user's badges to not be featured
      await tx.userBadge.updateMany({
        where: {
          userId: userId,
          isFeatured: true,
        },
        data: {
          isFeatured: false,
        },
      });

      // 2. Set the new featured badges
      if (badgeIds.length > 0) {
        await tx.userBadge.updateMany({
          where: {
            userId: userId,
            badgeId: { in: badgeIds },
          },
          data: {
            isFeatured: true,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Featured badges updated successfully.' });

  } catch (error) {
    console.error("Failed to update featured badges:", error);
    return NextResponse.json({ error: 'Failed to update featured badges' }, { status: 500 });
  }
}
