// src/app/api/reviews/[reviewId]/report/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * POST: 특정 리뷰를 "검토 필요(needsModeration)"로 신고합니다.
 */
export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const session = await getServerSession(authOptions);
  // 로그인한 사용자만 신고 가능
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviewId = parseInt(params.reviewId, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
  }

  try {
    // 자신의 리뷰는 신고할 수 없도록 체크 (선택 사항)
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true }
    });

    if (review?.userId === session.user.id) {
        return NextResponse.json({ error: 'You cannot report your own review' }, { status: 403 });
    }

    // 해당 리뷰의 needsModeration 플래그를 true로 설정
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        needsModeration: true, // 관리자가 검토하도록 플래그 설정
      },
    });

    return NextResponse.json({ success: true, message: 'Review reported successfully.' });

  } catch (error) {
    console.error('Failed to report review:', error);
    return NextResponse.json({ error: 'Failed to report review' }, { status: 500 });
  }
}