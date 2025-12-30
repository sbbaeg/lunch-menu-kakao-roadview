// app/api/tags/[id]/subscribe/route.ts

import { awardBadge } from '@/lib/awardBadge';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { checkAndAwardMasteryBadges } from '@/lib/badgeLogic';

/**
 * POST: 특정 태그를 구독하거나 구독을 취소합니다 (토글 방식).
 */
export async function POST(
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

        // 2. 구독 대상 태그가 유효한지 확인
        const tagToSubscribe = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        // 태그가 없거나, 공개되지 않았거나, 자기 자신의 태그인 경우 구독 불가
        if (!tagToSubscribe || !tagToSubscribe.isPublic || tagToSubscribe.userId === session.user.id) {
            return NextResponse.json({ error: '구독할 수 없는 태그입니다.' }, { status: 404 });
        }

        // 3. 이미 구독 중인지 확인
        const existingSubscription = await prisma.tagSubscription.findUnique({
            where: {
                userId_tagId: {
                    userId: session.user.id,
                    tagId: tagId,
                }
            },
        });

        // 4. 분기 처리: 구독 중이면 삭제(구독 취소), 아니면 생성(구독)
        if (existingSubscription) {
            await prisma.tagSubscription.delete({
                where: {
                    userId_tagId: {
                        userId: session.user.id,
                        tagId: tagId,
                    }
                },
            });
            return NextResponse.json({ message: '구독이 취소되었습니다.', action: 'unsubscribed' });
        } else {
            const oldSubscriberCount = await prisma.tagSubscription.count({ where: { tagId: tagId } });

            await prisma.tagSubscription.create({
                data: {
                    userId: session.user.id,
                    tagId: tagId,
                },
            });

            const newSubscriberCount = oldSubscriberCount + 1;

            // --- Badge Awarding Logic for Tag Subscribers ---
            const badgeThresholds: { [key: number]: string } = {
                10: '주목받는 태그',
                25: '유명 태그',
                50: '인기 태그 마스터',
            };

            for (const threshold of Object.keys(badgeThresholds).map(Number)) {
                if (newSubscriberCount >= threshold && oldSubscriberCount < threshold) {
                    const badgeName = badgeThresholds[threshold];
                    await awardBadge(tagToSubscribe.userId, badgeName);
                    
                    const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
                    if (badge && badge.tier === 'GOLD') {
                        await checkAndAwardMasteryBadges(tagToSubscribe.userId);
                    }
                }
            }
            // --- End of Badge Logic ---

            // --- Badge Awarding Logic for User Subscribing to Tags ---
            const userSubscriptionCount = await prisma.tagSubscription.count({ where: { userId: session.user.id } });
            const userBadgeThresholds: { [key: number]: string } = {
                10: '탐험가',
                50: '큐레이터',
                150: '지식의 보고',
            };

            if (userBadgeThresholds[userSubscriptionCount]) {
                const badgeName = userBadgeThresholds[userSubscriptionCount];
                await awardBadge(session.user.id, badgeName);
                
                const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
                if (badge && badge.tier === 'GOLD') {
                    await checkAndAwardMasteryBadges(session.user.id);
                }
            }
            // --- End of Badge Logic ---

            return NextResponse.json({ message: '태그를 구독했습니다.', action: 'subscribed' });
        }

    } catch (error) {
        console.error('태그 구독 처리 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}