// src/app/api/tags/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tagId = parseInt(params.id, 10);
  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
  }

  try {
    const { rating, text } = await request.json();
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const userId = session.user.id;

    const newReview = await prisma.tagReview.upsert({
      where: {
        userId_tagId: { userId, tagId },
      },
      update: { rating, text },
      create: { userId, tagId, rating, text },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newReview);

  } catch (error) {
    console.error(`Failed to create/update review for tag ${tagId}:`, error);
    return NextResponse.json({ error: 'Failed to create/update review' }, { status: 500 });
  }
}