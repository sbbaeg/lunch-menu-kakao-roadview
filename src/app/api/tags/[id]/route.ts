import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { type Restaurant } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps'; // ✅ Google 상세 정보 조회를 위해 import
import { AppRestaurant } from '@/lib/types';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    try {
        const tagId = parseInt(params.id, 10);
        if (isNaN(tagId)) {
            return NextResponse.json({ error: '잘못된 태그 ID입니다.' }, { status: 400 });
        }

        // ✅ 태그 정보와 함께 구독자 수(_count)를 함께 조회합니다.
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            include: { 
                user: { select: { id: true, name: true } },
                _count: {
                    select: { subscribers: true }
                }
            }
        });

        // 태그가 없거나, (로그인하지 않은 사용자가) 비공개 태그에 접근하려 할 때
        if (!tag || (!tag.isPublic && tag.userId !== session?.user?.id)) {
            return NextResponse.json({ error: '존재하지 않거나 접근 권한이 없는 태그입니다.' }, { status: 404 });
        }

        // 기본 맛집 목록 조회
        const basicRestaurants: Restaurant[] = await prisma.restaurant.findMany({
            where: { taggedBy: { some: { tagId: tagId } } },
        });

        // ✅ 각 맛집에 대해 Google 상세 정보를 포함한 전체 정보를 가져옵니다.
        const enrichedRestaurants = await Promise.all(
            basicRestaurants.map(restaurant => 
                fetchFullGoogleDetails({
                    id: restaurant.kakaoPlaceId,
                    place_name: restaurant.placeName,
                    category_name: restaurant.categoryName || '',
                    road_address_name: restaurant.address || '',
                    address_name: restaurant.address || '',
                    x: String(restaurant.longitude),
                    y: String(restaurant.latitude),
                    place_url: `https://place.map.kakao.com/${restaurant.kakaoPlaceId}`,
                    distance: '',
                })
            )
        );

        const finalRestaurants: AppRestaurant[] = enrichedRestaurants.map(place => ({
            id: place.id,
            kakaoPlaceId: place.id,
            placeName: place.place_name,
            categoryName: place.category_name,
            address: place.road_address_name,
            x: place.x,
            y: place.y,
            placeUrl: place.place_url,
            distance: '', // 이 페이지에서는 거리 정보가 없으므로 빈 문자열로 보냅니다.
            googleDetails: place.googleDetails,
            tags: [], // RestaurantCard가 tags prop을 기대하므로 빈 배열을 추가합니다.
                      // (추후 이 부분도 DB에서 조회하여 채울 수 있습니다)
        }));

        let isSubscribed = false;
        if (session?.user?.id) {
            const subscription = await prisma.tagSubscription.findUnique({
                where: { userId_tagId: { userId: session.user.id, tagId: tagId } }
            });
            isSubscribed = !!subscription;
        }
        
        return NextResponse.json({
            id: tag.id,
            name: tag.name,
            creator: { id: tag.user.id, name: tag.user.name },
            restaurants: finalRestaurants, // ✅ 상세 정보가 포함된 맛집 목록으로 교체
            isSubscribed: isSubscribed,
            subscriberCount: tag._count.subscribers, // ✅ 구독자 수 추가
            restaurantCount: basicRestaurants.length, // ✅ 맛집 수 추가
        });

    } catch (error) {
        console.error('태그 프로필 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const tagId = parseInt(params.id, 10);
        if (isNaN(tagId)) {
            return NextResponse.json({ error: '잘못된 태그 ID입니다.' }, { status: 400 });
        }

        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.userId !== session.user.id) {
            return NextResponse.json({ error: '삭제 권한이 없는 태그입니다.' }, { status: 403 });
        }

        await prisma.tagsOnRestaurants.deleteMany({
            where: { tagId: tagId },
        });
        
        // 구독 정보도 함께 삭제
        await prisma.tagSubscription.deleteMany({
            where: { tagId: tagId },
        });

        await prisma.tag.delete({
            where: { id: tagId },
        });

        return NextResponse.json({ message: '태그가 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('태그 삭제 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}