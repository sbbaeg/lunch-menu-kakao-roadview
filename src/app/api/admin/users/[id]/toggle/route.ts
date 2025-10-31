import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();
    const { type, status } = body;

    if (!['isAdmin', 'isBanned'].includes(type) || typeof status !== 'boolean') {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Prevent admin from banning themselves or revoking their own admin status
    if (userId === session.user.id && (type === 'isBanned' || (type === 'isAdmin' && !status))) {
        return NextResponse.json({ error: 'Cannot modify your own status.' }, { status: 403 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                [type]: status,
            },
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
                    }
                },
                tags: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            },
        });
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }
}