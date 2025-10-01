// app/api/favorites/route.ts (최종 완성본)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Prisma } from '@prisma/client'; 
import { authOptions } from '@/lib/auth';
import { Restaurant, KakaoPlaceItem } from '@/lib/types'; 
import { fetchFullGoogleDetails } from '@/lib/googleMaps';

const prisma = new PrismaClient();

type FavoriteWithTags = Prisma.FavoriteGetPayload<{
    include: { 
        restaurant: {
            include: {
                taggedBy: {
                    include: {
                        tag: true
                    }
                }
            }
        } 
    }
}>;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    try {
        const favorites: FavoriteWithTags[] = await prisma.favorite.findMany({
            where: { userId: session.user.id },
            include: { 
                restaurant: {
                    include: {
                        taggedBy: {
                            include: {
                                tag: true
                            }
                        }
                    }
                } 
            },
        });

        // ✅ 3. DB 데이터를 Google 정보 조회에 필요한 형태로 1차 변환합니다.
        const basicFavorites: KakaoPlaceItem[] = favorites.map(fav => ({
            id: fav.restaurant.kakaoPlaceId,
            place_name: fav.restaurant.placeName,
            category_name: fav.restaurant.categoryName || '',
            road_address_name: fav.restaurant.address || '',
            address_name: fav.restaurant.address || '',
            x: String(fav.restaurant.longitude),
            y: String(fav.restaurant.latitude),
            place_url: `https://place.map.kakao.com/${fav.restaurant.kakaoPlaceId}`,
            distance: '',
        }));

        // ✅ 4. 각 항목에 대해 Google 상세 정보를 병렬로 조회합니다.
        const enrichedFavorites = await Promise.all(
            basicFavorites.map(place => fetchFullGoogleDetails(place))
        );

        // ✅ 5. 최종적으로 프론트엔드가 사용할 형태로 데이터를 가공합니다.
        const favoriteRestaurants: Restaurant[] = enrichedFavorites.map((place, index) => {
    // 🔽 원본 favorites 배열에서 현재 순서(index)에 맞는 항목을 찾습니다.
            const originalFavorite = favorites[index];
            return {
                id: place.id,
                placeName: place.place_name,
                categoryName: place.category_name,
                address: place.road_address_name,
                x: place.x,
                y: place.y,
                placeUrl: place.place_url,
                distance: place.distance,
                googleDetails: place.googleDetails,
                // 🔽 위에서 찾은 항목에서 태그 정보를 가져와 추가합니다.
                tags: originalFavorite.restaurant.taggedBy.map(t => t.tag)
            };
        });

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