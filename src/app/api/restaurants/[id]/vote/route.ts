// src/app/api/restaurants/[id]/vote/route.ts
import { NextResponse } from 'next/server';
import { VoteType } from '@prisma/client';
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

  const restaurantId = parseInt(params.id, 10);
  if (isNaN(restaurantId)) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  try {
    const { voteType }: { voteType: VoteType } = await request.json(); // 'UPVOTE' or 'DOWNVOTE'
    const userId = session.user.id;

    const existingVote = await prisma.restaurantVote.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
    });

    let likeIncrement = 0;
    let dislikeIncrement = 0;
    
    // Prisma 트랜잭션으로 두 테이블을 동시에 업데이트
    const result = await prisma.$transaction(async (tx) => {
      if (existingVote) {
        if (existingVote.type === voteType) {
          // 1. 투표 취소
          await tx.restaurantVote.delete({
            where: { userId_restaurantId: { userId, restaurantId } },
          });
          if (voteType === 'UPVOTE') likeIncrement = -1;
          else dislikeIncrement = -1;

        } else {
          // 2. 투표 변경 (예: 싫어요 -> 좋아요)
          await tx.restaurantVote.update({
            where: { userId_restaurantId: { userId, restaurantId } },
            data: { type: voteType },
          });
          if (voteType === 'UPVOTE') {
            likeIncrement = 1;
            dislikeIncrement = -1;
          } else {
            likeIncrement = -1;
            dislikeIncrement = 1;
          }
        }
      } else {
        // 3. 신규 투표
        await tx.restaurantVote.create({
          data: { userId, restaurantId, type: voteType },
        });
        if (voteType === 'UPVOTE') likeIncrement = 1;
        else dislikeIncrement = 1;
      }

      // 4. Restaurant 모델의 카운트 필드를 원자적(atomic)으로 업데이트
      const updatedRestaurant = await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          likeCount: { increment: likeIncrement },
          dislikeCount: { increment: dislikeIncrement },
        },
        select: { likeCount: true, dislikeCount: true } // 최신 카운트 반환
      });

      // 5. 현재 사용자의 투표 상태 반환
      const newVoteType = (existingVote?.type === voteType) ? null : voteType;

      return { ...updatedRestaurant, currentUserVote: newVoteType };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Failed to vote on restaurant:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}