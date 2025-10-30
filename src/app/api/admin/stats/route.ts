
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const [userCount, restaurantCount, reviewCount, tagCount, restaurantVoteCount, reviewVoteCount] = await prisma.$transaction([
            prisma.user.count(),
            prisma.restaurant.count(),
            prisma.review.count(),
            prisma.tag.count(),
            prisma.restaurantVote.count(),
            prisma.reviewVote.count(),
        ]);

        const stats = {
            users: userCount,
            restaurants: restaurantCount,
            reviews: reviewCount,
            tags: tagCount,
            restaurantVotes: restaurantVoteCount,
            reviewVotes: reviewVoteCount,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
    }
}
