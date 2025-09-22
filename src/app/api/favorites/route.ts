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
        const place = await request.json();
        const userId = session.user.id;

        // 1. kakaoPlaceId로 우리 DB에 해당 음식점이 있는지 먼저 확인합니다.
        let restaurant = await prisma.restaurant.findUnique({
            where: { kakaoPlaceId: place.id },
        });

        // 2. DB에 음식점이 없는 경우 (새로 즐겨찾기 추가 시)
        if (!restaurant) {
            // 프론트에서 받은 정보가 완전한지 확인하고, 없다면 생성합니다.
            if (!place.place_name || !place.category_name) {
                 return NextResponse.json({ error: '음식점 정보가 불완전하여 추가할 수 없습니다.' }, { status: 400 });
            }
            restaurant = await prisma.restaurant.create({
                data: {
                    kakaoPlaceId: place.id,
                    placeName: place.place_name,
                    address: place.road_address_name,
                    latitude: parseFloat(place.y),
                    longitude: parseFloat(place.x),
                    categoryName: place.category_name,
                },
            });
        }
        
        const restaurantId = restaurant.id;

        // 3. 이 음식점이 현재 유저의 즐겨찾기에 등록되어 있는지 확인합니다.
        const existingFavorite = await prisma.favorite.findUnique({
            where: { userId_restaurantId: { userId, restaurantId } },
        });

        // 4. 즐겨찾기에 이미 있다면 -> 삭제 로직 실행
        if (existingFavorite) {
            await prisma.favorite.delete({
                where: { userId_restaurantId: { userId, restaurantId } },
            });
            return NextResponse.json({ message: '즐겨찾기에서 삭제되었습니다.', action: 'deleted' });
        } 
        // 5. 즐겨찾기에 없다면 -> 추가 로직 실행
        else {
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