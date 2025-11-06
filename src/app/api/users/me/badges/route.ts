// src/app/api/users/me/badges/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: userId },
      include: {
        badge: true, // Include the full badge details
      },
      orderBy: {
        createdAt: 'desc', // Show most recently earned badges first
      },
    });

    // Return only the badge objects, not the join table records
    const badges = userBadges.map(userBadge => userBadge.badge);

    return NextResponse.json(badges);

  } catch (error) {
    console.error("Failed to fetch user's badges:", error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
