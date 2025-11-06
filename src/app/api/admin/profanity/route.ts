
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 관리자만 접근 가능한 API

// 모든 비속어 목록 가져오기
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const words = await prisma.profanityWord.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(words);
    } catch (error) {
        console.error('비속어 조회 오류:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}

// 새로운 비속어 추가
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { word } = await request.json();
        if (!word || typeof word !== 'string' || word.trim() === '') {
            return NextResponse.json({ error: '단어가 올바르지 않습니다.' }, { status: 400 });
        }

        const newWord = await prisma.profanityWord.create({
            data: {
                word: word.trim(),
            },
        });
        return NextResponse.json(newWord, { status: 201 });
    } catch (error) {
        console.error('비속어 추가 오류:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}

// 비속어 삭제
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json({ error: 'ID가 올바르지 않습니다.' }, { status: 400 });
        }

        await prisma.profanityWord.delete({
            where: { id },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error('비속어 삭제 오류:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}
