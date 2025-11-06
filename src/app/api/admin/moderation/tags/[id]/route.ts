
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

// 태그 수정 (관리자)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await checkAdmin();
        const tagId = parseInt(params.id, 10);
        const { name } = await request.json();

        if (isNaN(tagId)) {
            return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
        }
        if (typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
        }

        const updatedTag = await prisma.tag.update({
            where: { id: tagId },
            data: {
                name,
                needsModeration: false,
            },
        });

        // Create notification for the user
        await prisma.notification.create({
            data: {
                userId: updatedTag.userId,
                type: 'MODERATION',
                message: `관리자에 의해 회원님의 태그가 \'${updatedTag.name}\'(으)로 수정되었습니다.`,
            }
        });

        return NextResponse.json(updatedTag);
    } catch (error) {
        console.error('Error updating tag:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
    }
}

// 태그 삭제 (관리자)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await checkAdmin();
        const tagId = parseInt(params.id, 10);

        if (isNaN(tagId)) {
            return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
        }

        // First, find the tag to get creatorId and name for notification
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
        }

        await prisma.tag.delete({
            where: { id: tagId },
        });

        // Create notification for the user
        await prisma.notification.create({
            data: {
                userId: tag.userId,
                type: 'MODERATION',
                message: `관리자에 의해 회원님의 \'${tag.name}\' 태그가 삭제되었습니다.`,
            }
        });

        return NextResponse.json({ message: 'Tag deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting tag:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }
}
