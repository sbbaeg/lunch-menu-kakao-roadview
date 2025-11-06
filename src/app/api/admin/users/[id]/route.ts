
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                reviews: {
                    select: {
                        id: true,
                        text: true,
                        rating: true,
                        restaurant: {
                            select: {
                                placeName: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                tags: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}
