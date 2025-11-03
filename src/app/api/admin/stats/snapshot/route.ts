
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const authHeader = headers().get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    try {
        const existingStat = await prisma.dailyStat.findUnique({
            where: { date: yesterday },
        });

        if (existingStat) {
            return NextResponse.json({ message: 'Stats for yesterday already exist.' }, { status: 200 });
        }

        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        const newReviews = await prisma.review.count({
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        const newTags = await prisma.tag.count({
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        const newRestaurantVotes = await prisma.restaurantVote.count({
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        const newReviewVotes = await prisma.reviewVote.count({
            where: {
                createdAt: {
                    gte: yesterday,
                    lt: today,
                },
            },
        });

        await prisma.dailyStat.create({
            data: {
                date: yesterday,
                newUsers,
                newReviews,
                newTags,
                newRestaurantVotes,
                newReviewVotes,
            },
        });

        return NextResponse.json({ message: 'Successfully created daily stats snapshot.' });

    } catch (error) {
        console.error("Error creating daily stat snapshot:", error);
        return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }
}
