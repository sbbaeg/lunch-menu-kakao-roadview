import { awardBadge } from '@/lib/awardBadge';
// src/app/api/restaurants/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAndAwardMasteryBadges } from '@/lib/badgeLogic';

// 특정 식당의 모든 리뷰를 가져오는 GET 핸들러
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const restaurantId = parseInt(params.id, 10);
  if (isNaN(restaurantId)) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const reviewsFromDb = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            isBanned: true,
            userBadges: {
              where: { isFeatured: true },
              include: {
                badge: true,
              },
            },
          },
        },
        votes: {
          select: {
            userId: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 데이터 가공: 추천/비추천 수 및 현재 사용자 투표 상태 추가
    const reviews = reviewsFromDb.map(review => {
      const upvotes = review.votes.filter(v => v.type === 'UPVOTE').length;
      const downvotes = review.votes.filter(v => v.type === 'DOWNVOTE').length;
      const currentUserVote = userId ? review.votes.find(v => v.userId === userId)?.type || null : null;

      const { user, votes, ...reviewData } = review;
      const { userBadges, ...restOfUser } = user;

      return {
        ...reviewData,
        user: {
          ...restOfUser,
          featuredBadges: userBadges.map(ub => ub.badge),
        },
        upvotes,
        downvotes,
        currentUserVote,
      };
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

  // Banned user check
  if (session.user.isBanned) {
    return NextResponse.json({ error: 'Banned users cannot post reviews.' }, { status: 403 });
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

    // 비속어 검사 로직 추가
    const profanityWords = await prisma.profanityWord.findMany();
    const lowerCaseText = text ? text.toLowerCase() : '';

    const needsModeration = text ? profanityWords.some(badWord => 
        lowerCaseText.includes(badWord.word.toLowerCase())
    ) : false;

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
        needsModeration: needsModeration, // 검사 결과 반영
      },
      create: {
        userId,
        restaurantId,
        rating,
        text,
        needsModeration: needsModeration, // 검사 결과 반영
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

    // --- Badge Awarding Logic ---
    const reviewCount = await prisma.review.count({
      where: { userId: userId },
    });

    const badgeThresholds: { [key: number]: string } = {
        1: '첫 발자국',
        10: '리뷰어',
        50: '프로 리뷰어'
    };

    if (badgeThresholds[reviewCount]) {
        const badgeName = badgeThresholds[reviewCount];
        await awardBadge(userId, badgeName);
        
        const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
        if (badge && badge.tier === 'GOLD') {
            await checkAndAwardMasteryBadges(userId);
        }
    }
    // --- End of Badge Logic ---

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to post review:', error);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
