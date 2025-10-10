// app/api/tags/[id]/toggle-public/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * PATCH: 특정 태그의 공개(isPublic) 상태를 토글합니다.
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    // 1. 로그인한 사용자인지 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const tagId = parseInt(params.id, 10);
        if (isNaN(tagId)) {
            return NextResponse.json({ error: '잘못된 태그 ID입니다.' }, { status: 400 });
        }

        // 2. 태그를 DB에서 조회
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            return NextResponse.json({ error: '존재하지 않는 태그입니다.' }, { status: 404 });
        }

        // 3. 태그 소유권 확인 (매우 중요)
        if (tag.userId !== session.user.id) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        // 4. isPublic 상태를 현재와 반대로 변경하여 업데이트
        const updatedTag = await prisma.tag.update({
            where: { id: tagId },
            data: { isPublic: !tag.isPublic },
        });

        return NextResponse.json(updatedTag);

    } catch (error) {
        console.error('태그 공개 상태 변경 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}