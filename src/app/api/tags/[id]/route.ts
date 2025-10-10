import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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

        // 태그가 현재 사용자의 소유인지 확인
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.userId !== session.user.id) {
            return NextResponse.json({ error: '삭제 권한이 없는 태그입니다.' }, { status: 403 });
        }

        // 연결된 레코드를 먼저 삭제 (TagsOnRestaurants)
        await prisma.tagsOnRestaurants.deleteMany({
            where: { tagId: tagId },
        });

        // 태그 삭제
        await prisma.tag.delete({
            where: { id: tagId },
        });

        return NextResponse.json({ message: '태그가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('태그 삭제 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
