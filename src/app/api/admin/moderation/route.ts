// src/app/api/admin/moderation/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: 관리자용. 검토가 필요한(needsModeration=true) 모든 태그와 리뷰 목록을 조회합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    // 관리자만 접근 가능
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        // 검토가 필요한 태그 조회 (생성자 정보 포함)
        const tags = await prisma.tag.findMany({
            where: { needsModeration: true },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        // 검토가 필요한 리뷰 조회 (작성자, 음식점 정보 포함)
        const reviews = await prisma.review.findMany({
            where: { needsModeration: true },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                restaurant: {
                    select: { id: true, placeName: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        return NextResponse.json({ tags, reviews });

    } catch (error) {
        console.error('검토 목록 조회 오류:', error);
        return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
    }
}