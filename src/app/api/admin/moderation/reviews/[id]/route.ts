
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized');
    }
}

// 리뷰 수정 (관리자)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await checkAdmin();
        const reviewId = parseInt(params.id, 10);
        const { text } = await request.json();

        if (isNaN(reviewId)) {
            return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
        }
        if (typeof text !== 'string' || text.trim() === '') {
            return NextResponse.json({ error: 'Review text cannot be empty' }, { status: 400 });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                text,
                needsModeration: false,
            },
            include: {
                restaurant: {
                    select: {
                        placeName: true,
                    }
                }
            }
        });

        // Create notification for the user
        await prisma.notification.create({
            data: {
                userId: updatedReview.userId,
                type: 'MODERATION',
                message: `관리자에 의해 회원님의 \'${updatedReview.restaurant.placeName}\' 리뷰가 수정되었습니다.`,
            }
        });

        return NextResponse.json(updatedReview);
    } catch (error) {
        console.error('Error updating review:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

// 리뷰 삭제 (관리자)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await checkAdmin();
        const reviewId = parseInt(params.id, 10);

        if (isNaN(reviewId)) {
            return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
        }

        // First, find the review to get authorId and restaurant name for notification
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                restaurant: {
                    select: {
                        placeName: true,
                    }
                }
            }
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        await prisma.review.delete({
            where: { id: reviewId },
        });

        // Create notification for the user
        await prisma.notification.create({
            data: {
                userId: review.userId,
                type: 'MODERATION',
                message: `관리자에 의해 회원님의 \'${review.restaurant.placeName}\' 리뷰가 삭제되었습니다.`,
            }
        });

        return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting review:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
