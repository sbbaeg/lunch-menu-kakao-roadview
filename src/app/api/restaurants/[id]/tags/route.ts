// @ts-nocheck 


import { NextRequest, NextResponse } from 'next/server'; // ✅ 1. NextRequest를 import합니다.
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest, // ✅ 2. request 타입을 NextRequest로 지정합니다.
    { params }: { params: { id: string } } // ✅ 3. 두 번째 인자에서 { params }를 직접 꺼냅니다.
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const restaurantId = parseInt(params.id, 10); // ✅ 4. context 없이 params.id로 바로 사용합니다.
        const { tagId } = await request.json();

        if (isNaN(restaurantId) || !tagId) {
            return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }
        
        const existingLink = await prisma.tagsOnRestaurants.findUnique({
            where: {
                restaurantId_tagId: {
                    restaurantId: restaurantId,
                    tagId: tagId,
                }
            },
        });

        if (existingLink) {
            await prisma.tagsOnRestaurants.delete({
                where: {
                    restaurantId_tagId: {
                        restaurantId: restaurantId,
                        tagId: tagId,
                    }
                },
            });
            return NextResponse.json({ message: '태그가 음식점에서 삭제되었습니다.', action: 'detached' });
        } else {
            await prisma.tagsOnRestaurants.create({
                data: {
                    restaurantId: restaurantId,
                    tagId: tagId,
                },
            });
            return NextResponse.json({ message: '태그가 음식점에 추가되었습니다.', action: 'attached' });
        }
    } catch (error) {
        console.error('태그 연결/해제 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}