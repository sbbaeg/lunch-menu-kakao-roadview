// src/app/api/users/me/badges/new-count/route.ts
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

    const newBadgesCount = await prisma.userBadge.count({
      where: {
        userId: userId,
        isViewed: false,
      },
    });

    return NextResponse.json({ count: newBadgesCount });
  } catch (error) {
    console.error('[API Error] Failed to get new badges count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
