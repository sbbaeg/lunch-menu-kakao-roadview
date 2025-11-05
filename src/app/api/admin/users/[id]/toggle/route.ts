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
    const { type, status, reason } = body;

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

        // If the user is being banned, create a notification
        if (type === 'isBanned' && status === true) {
            const notificationMessage = reason && typeof reason === 'string' && reason.trim() !== ''
                ? `관리자에 의해 계정이 차단되었습니다. 사유: ${reason}`
                : '관리자에 의해 계정이 차단되었습니다.';

            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'BANNED',
                    message: notificationMessage,
                },
            });
        } else if (type === 'isBanned' && status === false) {
            // If the user is being unbanned, create a notification
            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'MODERATION',
                    message: '계정 차단이 해제되었습니다.',
                },
            });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }
}