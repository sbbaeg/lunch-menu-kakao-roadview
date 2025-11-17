
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { VoteType } from '@prisma/client';

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

  const { voteType } = (await request.json()) as { voteType: VoteType };
  if (!['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const existingVote = await prisma.restaurantVote.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    });

    let likeIncrement = 0;
    let dislikeIncrement = 0;

    await prisma.$transaction(async (tx) => {
      if (existingVote) {
        // If the user is submitting the same vote again, it's a cancellation.
        if (existingVote.type === voteType) {
          await tx.restaurantVote.delete({
            where: { 
              userId_restaurantId: {
                userId,
                restaurantId,
              }
            },
          });
          if (voteType === 'UPVOTE') {
            likeIncrement = -1;
          } else {
            dislikeIncrement = -1;
          }
        } else {
          // If the user is changing their vote.
          await tx.restaurantVote.update({
            where: {
              userId_restaurantId: {
                userId,
                restaurantId,
              }
            },
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
        // If there is no existing vote, create a new one.
        await tx.restaurantVote.create({
          data: {
            userId,
            restaurantId,
            type: voteType,
          },
        });
        if (voteType === 'UPVOTE') {
          likeIncrement = 1;
        } else {
          dislikeIncrement = 1;
        }
      }

      // Update the aggregate counts on the restaurant
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          likeCount: { increment: likeIncrement },
          dislikeCount: { increment: dislikeIncrement },
        },
      });
    });

    // After the transaction, fetch the new state to return to the client
    const updatedRestaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
            likeCount: true,
            dislikeCount: true,
        }
    });

    const userVote = await prisma.restaurantVote.findUnique({
        where: {
            userId_restaurantId: {
                userId,
                restaurantId,
            },
        },
        select: { type: true }
    });

    return NextResponse.json({ 
        ...updatedRestaurant,
        currentUserVote: userVote?.type ?? null
    });

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
