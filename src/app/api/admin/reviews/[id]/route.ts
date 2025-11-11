
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/admin/reviews/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
        return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    try {
        await prisma.review.delete({
            where: { id: reviewId },
        });
        return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`[ADMIN_DELETE_REVIEW_ERROR]`, error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}

// PUT /api/admin/reviews/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
        return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    try {
        const { text, rating } = await request.json();

        if (typeof text === 'undefined' || typeof rating === 'undefined') {
            return NextResponse.json({ error: 'Text and rating are required' }, { status: 400 });
        }
        
        if (typeof rating !== 'number' || rating < 0 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                text,
                rating,
                needsModeration: false, // Admin is editing, so moderation is not needed
            },
        });

        return NextResponse.json(updatedReview, { status: 200 });
    } catch (error) {
        console.error(`[ADMIN_UPDATE_REVIEW_ERROR]`, error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}
