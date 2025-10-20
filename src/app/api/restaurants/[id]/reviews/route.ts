// src/app/api/restaurants/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// 특정 식당의 모든 리뷰를 가져오는 GET 핸들러
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // restaurantId는 데이터베이스의 auto-increment ID입니다.
  const restaurantId = parseInt(params.id, 10);

  if (isNaN(restaurantId)) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: { // 리뷰 작성자의 정보 중, 이름과 이미지만 선택적으로 가져옵니다.
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 최신순으로 정렬
      },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// 특정 식당에 대한 리뷰를 작성(또는 수정)하는 POST 핸들러
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurantId = parseInt(params.id, 10);
  if (isNaN(restaurantId)) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  try {
    const { rating, text } = await request.json();
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
    }

    const userId = session.user.id;

    // 한 사용자가 한 식당에 대해 리뷰를 작성/수정 (upsert 사용)
    const review = await prisma.review.upsert({
      where: {
        userId_restaurantId: { // @@unique([userId, restaurantId]) 복합 키 이름
          userId,
          restaurantId,
        },
      },
      update: {
        rating,
        text,
      },
      create: {
        userId,
        restaurantId,
        rating,
        text,
      },
      include: { // 프론트엔드에서 바로 UI를 업데이트할 수 있도록 user 정보를 포함하여 반환
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to post review:', error);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
