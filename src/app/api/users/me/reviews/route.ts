// src/app/api/users/me/reviews/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET: 현재 로그인한 사용자가 작성한 모든 리뷰를 조회합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { userId: session.user.id },
            include: {
                restaurant: { // ❗️ 음식점 정보 포함
                    select: {
                        id: true,
                        placeName: true,
                        kakaoPlaceId: true // ❗️ 상세 페이지 이동에 필수
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(reviews);

    } catch (error) {
        console.error('내 리뷰 목록 조회 오류:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}