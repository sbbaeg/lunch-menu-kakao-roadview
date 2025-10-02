import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET: 현재 로그인한 사용자가 생성한 모든 태그 목록을 조회합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const tags = await prisma.tag.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' }, // 이름순으로 정렬
        });
        return NextResponse.json(tags);
    } catch (error) {
        console.error('태그 조회 오류:', error);
        return NextResponse.json({ error: '태그를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

/**
 * POST: 현재 로그인한 사용자의 새로운 태그를 생성합니다.
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const { name } = await request.json();

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ error: '태그 이름이 올바르지 않습니다.' }, { status: 400 });
        }

        const newTag = await prisma.tag.create({
            data: {
                name: name.trim(),
                userId: session.user.id,
            },
        });

        return NextResponse.json(newTag, { status: 201 }); // 201 Created
    } catch (error: unknown) {
        // Prisma 고유 제약 조건 위반 오류 코드 (P2002) - 중복된 태그 생성 시도
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({ error: '이미 존재하는 태그입니다.' }, { status: 409 });
        }
        console.error('태그 생성 오류:', error);
        return NextResponse.json({ error: '태그를 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}