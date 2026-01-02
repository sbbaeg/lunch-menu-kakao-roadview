// src/app/api/users/me/badges/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
        badge: true, // Revert back to include to get full badge details
      },
      orderBy: [
        { isFeatured: 'desc' }, // Featured badges first
        { createdAt: 'desc' },   // Then by most recently earned
      ],
    });

    // Prepare the response payload with the isViewed status
    const responseBadges = userBadges.map(userBadge => ({
      ...userBadge.badge,
      isFeatured: userBadge.isFeatured,
      isViewed: userBadge.isViewed,
    }));
    
    // Asynchronously update all unviewed badges for this user to be viewed
    // This is safer and doesn't rely on a non-existent 'id' field.
    prisma.userBadge.updateMany({
      where: { 
        userId: userId,
        isViewed: false 
      },
      data: { isViewed: true },
    }).catch(console.error); // Log errors but don't block the response

    return NextResponse.json(responseBadges);

  } catch (error) {
    console.error("Failed to fetch user's badges:", error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
