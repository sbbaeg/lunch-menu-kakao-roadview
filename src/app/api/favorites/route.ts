// src/app/api/favorites/route.ts (최종 수정본)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client'; // PrismaClient만 import 합니다.
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// --- 타입 정의 시작 ---

// 클라이언트에서 받을 음식점 데이터의 형태
interface RestaurantData {
    id: string; // kakaoPlaceId
    place_name: string;
    category_name: string;
    road_address_name: string;
    x: string;
    y: string;
}

// ✅ 직접 타입을 선언하여 Prisma/TypeScript 연동 문제를 원천 차단합니다.
// schema.prisma의 Restaurant 모델과 일치하는 타입
interface RestaurantModel {
    id: number;
    kakaoPlaceId: string;
    placeName: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// ✅ findMany + include의 결과물에 대한 타입
interface FavoriteWithRestaurant {
    userId: string;
    restaurantId: number;
    createdAt: Date;
    restaurant: RestaurantModel;
}

// --- 타입 정의 끝 ---


/**
 * GET: 현재 로그인한 사용자의 모든 즐겨찾기 목록을 반환합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const favorites: FavoriteWithRestaurant[] = await prisma.favorite.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                restaurant: true,
            },
        });
        
        const favoriteRestaurants = favorites.map(fav => ({
            ...fav.restaurant,
            id: fav.restaurant.kakaoPlaceId,
        }));
        
        return NextResponse.json(favoriteRestaurants);

    } catch (error) {
        console.error('즐겨찾기 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}


/**
 * POST: 즐겨찾기를 추가하거나 삭제합니다 (토글 방식).
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const place: RestaurantData = await request.json();
        const userId = session.user.id;

        const restaurant = await prisma.restaurant.upsert({
            where: { kakaoPlaceId: place.id },
            update: { placeName: place.place_name },
            create: {
                kakaoPlaceId: place.id,
                placeName: place.place_name,
                address: place.road_address_name,
                latitude: parseFloat(place.y),
                longitude: parseFloat(place.x),
            },
        });
        
        const restaurantId = restaurant.id;

        const existingFavorite = await prisma.favorite.findUnique({
            where: { userId_restaurantId: { userId, restaurantId } },
        });

        if (existingFavorite) {
            await prisma.favorite.delete({
                where: { userId_restaurantId: { userId, restaurantId } },
            });
            return NextResponse.json({ message: '즐겨찾기에서 삭제되었습니다.', action: 'deleted' });
        } else {
            await prisma.favorite.create({
                data: { userId, restaurantId },
            });
            return NextResponse.json({ message: '즐겨찾기에 추가되었습니다.', action: 'created' });
        }

    } catch (error) {
        console.error('즐겨찾기 처리 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}