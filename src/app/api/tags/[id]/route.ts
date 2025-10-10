import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    try {
        const tagId = parseInt(params.id, 10);
        if (isNaN(tagId)) {
            return NextResponse.json({ error: '잘못된 태그 ID입니다.' }, { status: 400 });
        }

        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            include: { user: { select: { id: true, name: true } } }
        });

        if (!tag || !tag.isPublic) {
            return NextResponse.json({ error: '존재하지 않거나 비공개된 태그입니다.' }, { status: 404 });
        }

        const restaurants = await prisma.restaurant.findMany({
            where: { taggedBy: { some: { tagId: tagId } } },
        });

        let isSubscribed = false;
        if (session?.user?.id) {
            const subscription = await prisma.tagSubscription.findUnique({
                where: { userId_tagId: { userId: session.user.id, tagId: tagId } }
            });
            isSubscribed = !!subscription;
        }
        
        return NextResponse.json({
            id: tag.id,
            name: tag.name,
            creator: { id: tag.user.id, name: tag.user.name },
            restaurants: restaurants,
            isSubscribed: isSubscribed,
        });

    } catch (error) {
        console.error('태그 프로필 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}


/**
 * DELETE: 특정 태그를 삭제합니다. (기존 코드)
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const tagId = parseInt(params.id, 10);
        if (isNaN(tagId)) {
            return NextResponse.json({ error: '잘못된 태그 ID입니다.' }, { status: 400 });
        }

        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.userId !== session.user.id) {
            return NextResponse.json({ error: '삭제 권한이 없는 태그입니다.' }, { status: 403 });
        }

        await prisma.tagsOnRestaurants.deleteMany({
            where: { tagId: tagId },
        });
        
        // 구독 정보도 함께 삭제
        await prisma.tagSubscription.deleteMany({
            where: { tagId: tagId },
        });

        await prisma.tag.delete({
            where: { id: tagId },
        });

        return NextResponse.json({ message: '태그가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('태그 삭제 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}