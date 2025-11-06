// src/app/api/restaurants/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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
        user: { // 리뷰 작성자 정보
          select: {
            name: true,
            image: true,
          },
        },
        votes: { // 모든 투표 정보
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

      const { votes, ...reviewData } = review;

      return {
        ...reviewData,
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

    // --- Badge Awarding Logic for '첫 발자국' ---
    const reviewCount = await prisma.review.count({
      where: { userId: userId },
    });

    if (reviewCount === 1) {
      const firstStepBadge = await prisma.badge.findUnique({
        where: { name: '첫 발자국' },
      });

      if (firstStepBadge) {
        // 혹시 모를 중복 방지를 위해 create 대신 upsert 사용도 고려할 수 있으나,
        // reviewCount가 1일 때만 실행되므로 create로도 충분합니다.
        await prisma.userBadge.create({
          data: {
            userId: userId,
            badgeId: firstStepBadge.id,
          },
        });
      }
    }
    // --- End of Badge Logic for '첫 발자국' ---

    // --- Badge Awarding Logic for '리뷰어' (10 reviews) ---
    if (reviewCount === 10) { // Check if this is their 10th review
      const reviewerBadge = await prisma.badge.findUnique({
        where: { name: '리뷰어' },
      });

      if (reviewerBadge) {
        // Check if user already has this badge to prevent duplicates
        const hasBadge = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId: userId, badgeId: reviewerBadge.id } },
        });

        if (!hasBadge) { // Only award if they don't have it yet
          await prisma.userBadge.create({
            data: {
              userId: userId,
              badgeId: reviewerBadge.id,
            },
          });
        }
      }
    }
    // --- End of Badge Logic for '리뷰어' ---

    // --- Badge Awarding Logic for '프로 리뷰어' (50 reviews) ---
    if (reviewCount === 50) {
      const proReviewerBadge = await prisma.badge.findUnique({
        where: { name: '프로 리뷰어' },
      });

      if (proReviewerBadge) {
        const hasBadge = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId: userId, badgeId: proReviewerBadge.id } },
        });

        if (!hasBadge) {
          await prisma.userBadge.create({
            data: {
              userId: userId,
              badgeId: proReviewerBadge.id,
            },
          });
        }
      }
    }
    // --- End of Badge Logic for '프로 리뷰어' ---

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to post review:', error);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
