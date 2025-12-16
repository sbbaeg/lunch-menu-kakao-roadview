import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppRestaurant } from '@/lib/types'; // Restaurant 타입을 가져옵니다.

// 타입을 별도로 정의
type RouteContext = {
    params: {
        id: string; // googlePlaceId
    };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const googlePlaceId = params.id;
        const { tagId, restaurant } = await request.json() as { tagId: number, restaurant: AppRestaurant };

        if (!tagId || !restaurant) {
            return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        // 1. 레스토랑 정보를 DB에 Upsert (없으면 생성, 있으면 가져오기)
        const dbRestaurant = await prisma.restaurant.upsert({
            where: { googlePlaceId: googlePlaceId },
            update: {},
            create: {
                googlePlaceId: restaurant.id,
                placeName: restaurant.placeName,
                address: restaurant.address,
                latitude: parseFloat(restaurant.y),
                longitude: parseFloat(restaurant.x),
                categoryName: restaurant.categoryName,
            },
        });

        // 2. DB에 저장된 레스토랑의 실제 ID (Int)를 사용
        const restaurantId = dbRestaurant.id;

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
