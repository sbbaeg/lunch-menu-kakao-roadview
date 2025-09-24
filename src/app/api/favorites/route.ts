// app/api/favorites/route.ts (최종 완성본)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Prisma } from '@prisma/client'; 
import { authOptions } from '@/lib/auth';
import { Restaurant } from '@/lib/types'; // ✅ 공용 Restaurant 타입을 import

const prisma = new PrismaClient();

type FavoriteWithRestaurant = Prisma.FavoriteGetPayload<{
  include: { restaurant: true; };
}>;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    try {
        const favorites: FavoriteWithRestaurant[] = await prisma.favorite.findMany({
            where: { userId: session.user.id },
            include: { restaurant: true },
        });
        
        const favoriteRestaurants: Restaurant[] = favorites.map(fav => ({
            id: fav.restaurant.kakaoPlaceId,
            placeName: fav.restaurant.placeName,
            categoryName: fav.restaurant.categoryName || '',
            address: fav.restaurant.address || '',
            x: String(fav.restaurant.longitude),
            y: String(fav.restaurant.latitude),
            placeUrl: `http://place.map.kakao.com/${fav.restaurant.kakaoPlaceId}`,
            distance: '',
        }));
        
        return NextResponse.json(favoriteRestaurants);
    } catch (error) {
        console.error('즐겨찾기 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    try {
        const place: Restaurant = await request.json(); 
        const userId = session.user.id;

        let restaurant = await prisma.restaurant.findUnique({
            where: { kakaoPlaceId: place.id },
        });

        if (!restaurant) {
            if (!place.placeName) {
                return NextResponse.json({ error: '음식점 이름 정보가 없어 추가할 수 없습니다.' }, { status: 400 });
            }
            restaurant = await prisma.restaurant.create({
                data: {
                    kakaoPlaceId: place.id,
                    placeName:    place.placeName,
                    address:      place.address,
                    latitude:     parseFloat(place.y),
                    longitude:    parseFloat(place.x),
                    categoryName: place.categoryName,
                },
            });
        }
        
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