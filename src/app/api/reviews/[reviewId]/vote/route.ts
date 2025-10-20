// src/app/api/reviews/[reviewId]/vote/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, VoteType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviewId = parseInt(params.reviewId, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
  }

  try {
    const { voteType }: { voteType: VoteType } = await request.json();
    if (!['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const userId = session.user.id;

    // 자신의 리뷰에는 투표할 수 없도록 체크
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId === userId) {
      return NextResponse.json({ error: 'You cannot vote on your own review' }, { status: 403 });
    }

    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    let action: 'created' | 'updated' | 'deleted';
    
    if (existingVote) {
      if (existingVote.type === voteType) {
        // 같은 타입의 버튼을 다시 누르면 투표 취소
        await prisma.reviewVote.delete({
          where: {
            userId_reviewId: {
              userId,
              reviewId,
            },
          },
        });
        action = 'deleted';
      } else {
        // 다른 타입의 버튼을 누르면 투표 변경
        await prisma.reviewVote.update({
          where: {
            userId_reviewId: {
              userId,
              reviewId,
            },
          },
          data: {
            type: voteType,
          },
        });
        action = 'updated';
      }
    } else {
      // 투표가 없으면 새로 생성
      await prisma.reviewVote.create({
        data: {
          userId,
          reviewId,
          type: voteType,
        },
      });
      action = 'created';
    }

    // 투표 후 최신 추천/비추천 수를 다시 계산하여 반환
    const voteCounts = await prisma.reviewVote.groupBy({
      by: ['type'],
      where: { reviewId },
      _count: {
        type: true,
      },
    });

    const upvotes = voteCounts.find(vc => vc.type === 'UPVOTE')?._count.type || 0;
    const downvotes = voteCounts.find(vc => vc.type === 'DOWNVOTE')?._count.type || 0;

    return NextResponse.json({
      success: true,
      action,
      upvotes,
      downvotes,
    });

  } catch (error) {
    console.error('Failed to vote on review:', error);
    return NextResponse.json({ error: 'Failed to vote on review' }, { status: 500 });
  }
}
