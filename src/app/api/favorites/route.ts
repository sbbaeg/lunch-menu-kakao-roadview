import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// ✅ Prisma 유틸리티 타입을 사용하기 위해 Prisma, Favorite을 추가로 import 합니다.
import { PrismaClient, Prisma, Favorite } from '@prisma/client';
import { authOptions } from '@/lib/auth';
// ✅ 프로젝트 공용 타입을 import 합니다.
import { Restaurant } from '@/lib/types';

// 💡 PrismaClient는 lib/prisma.ts 같은 별도 파일에서 싱글톤으로 관리하는 것을 추천합니다.
const prisma = new PrismaClient();

// ✅ 'Favorite'에 'Restaurant' 정보가 포함된 새로운 타입을 정의합니다.
// 'include'를 사용한 findMany 결과의 정확한 타입을 TypeScript에 알려줍니다.
type FavoriteWithRestaurant = Prisma.FavoriteGetPayload<{
  include: {
    restaurant: true;
  };
}>;

/**
 * GET: 현재 로그인한 사용자의 모든 즐겨찾기 목록을 반환합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        // ✅ findMany의 결과 타입을 위에서 만든 타입으로 명시해줍니다.
        const favorites: FavoriteWithRestaurant[] = await prisma.favorite.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                restaurant: true,
            },
        });
        
        // ✅ 프론트엔드의 Restaurant 타입 형식에 맞춰 데이터를 변환합니다.
        const favoriteRestaurants: Restaurant[] = favorites.map(fav => ({
            id: fav.restaurant.kakaoPlaceId,
            placeName: fav.restaurant.placeName,
            categoryName: fav.restaurant.categoryName || '',
            address: fav.restaurant.address || '',
            x: String(fav.restaurant.longitude),
            y: String(fav.restaurant.latitude),
            placeUrl: `http://place.map.kakao.com/${fav.restaurant.kakaoPlaceId}`,
            distance: '', // DB에는 distance 정보가 없으므로 빈 값으로 처리
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
        // ✅ 프론트에서 오는 데이터는 이제 통일된 Restaurant 타입입니다.
        const place: Restaurant = await request.json(); 
        const userId = session.user.id;

        let restaurant = await prisma.restaurant.findUnique({
            where: { kakaoPlaceId: place.id },
        });

        if (!restaurant) {
            if (!place.placeName) {
                return NextResponse.json({ error: '음식점 이름 정보가 없어 추가할 수 없습니다.' }, { status: 400 });
            }
            // ✅ 프론트에서 받은 camelCase 데이터를 DB의 camelCase 필드에 그대로 저장합니다.
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