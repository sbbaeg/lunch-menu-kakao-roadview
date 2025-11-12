// app/api/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: 현재 로그인한 사용자가 구독한 모든 태그 목록을 조회합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const subscriptions = await prisma.tagSubscription.findMany({
            where: { userId: session.user.id },
            include: {
                tag: { // 구독한 태그의 상세 정보 포함
                    include: {
                        user: { // 태그를 만든 사람의 정보 포함
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                tag: {
                    name: 'asc'
                }
            }
        });

        // 프론트엔드가 사용하기 편한 형태로 데이터를 가공
        const subscribedTags = subscriptions.map(sub => ({
            id: sub.tag.id,
            name: sub.tag.name,
            creatorName: sub.tag.user.name,
        }));

        return NextResponse.json(subscribedTags);

    } catch (error) {
        console.error('구독 태그 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}