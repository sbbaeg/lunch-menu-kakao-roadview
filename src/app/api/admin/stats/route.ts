
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Helper function to format time series data
const formatTimeSeries = (data: any[], key: string) => {
    const dayMap = new Map<string, number>();
    data.forEach(item => {
        const date = new Date(item.createdAt).toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + item._count.id);
    });
    
    const result = [];
    for(let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        result.push({ date: dateString, [key]: dayMap.get(dateString) || 0 });
    }
    return result;
};

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [ 
            userCount, restaurantCount, reviewCount, tagCount, restaurantVoteCount, reviewVoteCount,
            dailyNewUsers, dailyNewReviews
        ] = await prisma.$transaction([
            // Total Counts
            prisma.user.count(),
            prisma.restaurant.count(),
            prisma.review.count(),
            prisma.tag.count(),
            prisma.restaurantVote.count(),
            prisma.reviewVote.count(),
            // Time-series Data
            prisma.user.groupBy({ by: ['createdAt'], where: { createdAt: { gte: thirtyDaysAgo } }, _count: { id: true }, orderBy: { createdAt: 'asc' } }),
            prisma.review.groupBy({ by: ['createdAt'], where: { createdAt: { gte: thirtyDaysAgo } }, _count: { id: true }, orderBy: { createdAt: 'asc' } })
        ]);

        const stats = {
            totals: {
                users: userCount,
                restaurants: restaurantCount,
                reviews: reviewCount,
                tags: tagCount,
                restaurantVotes: restaurantVoteCount,
                reviewVotes: reviewVoteCount,
            },
            timeSeries: {
                dailyNewUsers: formatTimeSeries(dailyNewUsers, 'users'),
                dailyNewReviews: formatTimeSeries(dailyNewReviews, 'reviews'),
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
    }
}
