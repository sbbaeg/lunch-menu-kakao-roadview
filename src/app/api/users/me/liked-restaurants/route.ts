
import { NextRequest, NextResponse } from 'next/server';
import { VoteType } from '@prisma/client'; // 1. VoteType 임포트
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {
                votes: {
                    some: {
                        userId: session.user.id,
                        type: VoteType.UPVOTE,
                    },
                },
            },
            orderBy: {
                placeName: 'asc',
            },
        });

        return NextResponse.json(restaurants);
    } catch (error) {
        console.error('Error fetching liked restaurants:', error);
        return NextResponse.json({ error: 'Failed to fetch liked restaurants' }, { status: 500 });
    }
}
