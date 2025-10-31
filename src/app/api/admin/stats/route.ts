
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [ 
            userCount, reviewCount, tagCount, restaurantVoteCount, reviewVoteCount,
            dailyStats
        ] = await prisma.$transaction([
            // Total Counts
            prisma.user.count(),
            prisma.review.count(),
            prisma.tag.count(),
            prisma.restaurantVote.count(),
            prisma.reviewVote.count(),
            // Time-series Data from DailyStat
            prisma.dailyStat.findMany({
                where: { date: { gte: thirtyDaysAgo } },
                orderBy: { date: 'asc' },
            })
        ]);

        const stats = {
            totals: {
                users: userCount,
                reviews: reviewCount,
                tags: tagCount,
                restaurantVotes: restaurantVoteCount,
                reviewVotes: reviewVoteCount,
            },
            timeSeries: dailyStats.map(stat => ({
                date: stat.date.toISOString().split('T')[0],
                users: stat.newUsers,
                reviews: stat.newReviews,
                tags: stat.newTags,
                restaurantVotes: stat.newRestaurantVotes,
                reviewVotes: stat.newReviewVotes,
            }))
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
    }
}
