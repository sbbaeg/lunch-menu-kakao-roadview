import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client'; 
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppRestaurant, GooglePlaceItem } from '@/lib/types'; 
import { fetchFullGoogleDetails } from '@/lib/googleMaps';

type FavoriteWithTags = Prisma.FavoriteGetPayload<{
    include: { 
        restaurant: {
            include: {
                taggedBy: {
                    include: {
                        tag: {
                            include: {
                                user: true
                            }
                        }
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
                                tag: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } 
            },
        });

        const basicPlaces: GooglePlaceItem[] = favorites.map(fav => ({
            id: fav.restaurant.googlePlaceId,
            place_name: fav.restaurant.placeName,
            category_name: fav.restaurant.categoryName || '',
            road_address_name: fav.restaurant.address || '',
            address_name: fav.restaurant.address || '',
            x: String(fav.restaurant.longitude),
            y: String(fav.restaurant.latitude),
            place_url: `https://www.google.com/maps/place/?q=place_id:${fav.restaurant.googlePlaceId}`,
            distance: '',
        }));

        const enrichedFavorites = await Promise.all(
            basicPlaces.map(place => fetchFullGoogleDetails(place))
        );

        const favoriteRestaurants: AppRestaurant[] = enrichedFavorites.map((place, index) => {
            const originalFavorite = favorites[index];
            return {
                id: place.id,
                googlePlaceId: place.id,
                placeName: place.place_name,
                categoryName: place.category_name,
                address: place.road_address_name,
                x: place.x,
                y: place.y,
                placeUrl: place.place_url,
                distance: place.distance,
                googleDetails: place.googleDetails,
                tags: originalFavorite.restaurant.taggedBy.map(t => ({
                    id: t.tag.id,
                    name: t.tag.name,
                    isPublic: t.tag.isPublic,
                    creatorId: t.tag.user.id,
                    creatorName: t.tag.user.name,
                })),
                dbId: originalFavorite.restaurant.id,
                likeCount: originalFavorite.restaurant.likeCount,
                dislikeCount: originalFavorite.restaurant.dislikeCount,
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
        const place: AppRestaurant = await request.json(); 
        const userId = session.user.id;

        let restaurant = await prisma.restaurant.findUnique({
            where: { googlePlaceId: place.id },
        });

        if (!restaurant) {
            if (!place.placeName) {
                return NextResponse.json({ error: '음식점 이름 정보가 없어 추가할 수 없습니다.' }, { status: 400 });
            }
            restaurant = await prisma.restaurant.create({
                data: {
                    googlePlaceId: place.id,
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