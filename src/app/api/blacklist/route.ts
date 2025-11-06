import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppRestaurant } from '@/lib/types';

/**
 * GET: 현재 사용자의 블랙리스트 목록을 반환합니다.
 * '관리' UI에서 목록을 보여주기 위해 전체 Restaurant 객체 배열을 반환합니다.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const blacklistEntries = await prisma.blacklist.findMany({
            where: { userId: session.user.id },
            include: { restaurant: true }, // 레스토랑 상세 정보 포함
        });
        
        // 프론트엔드에서 사용하는 Restaurant 타입으로 변환
        const blacklistRestaurants: AppRestaurant[] = blacklistEntries.map(entry => ({
            id: entry.restaurant.kakaoPlaceId,
            kakaoPlaceId: entry.restaurant.kakaoPlaceId,
            placeName: entry.restaurant.placeName,
            categoryName: entry.restaurant.categoryName || '',
            address: entry.restaurant.address || '',
            x: String(entry.restaurant.longitude),
            y: String(entry.restaurant.latitude),
            placeUrl: `https://place.map.kakao.com/${entry.restaurant.kakaoPlaceId}`,
            distance: '', // 이 컨텍스트에서는 거리 정보가 필요 없음
        }));
        
        return NextResponse.json(blacklistRestaurants);
    } catch (error) {
        console.error('블랙리스트 조회 오류:', error);
        return NextResponse.json({ error: '데이터를 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

/**
 * POST: 특정 음식점을 블랙리스트에 추가하거나 삭제합니다 (토글 방식).
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    try {
        const place: AppRestaurant = await request.json();
        const userId = session.user.id;

        // Restaurant 테이블에 해당 음식점이 없으면 생성
        let restaurant = await prisma.restaurant.findUnique({
            where: { kakaoPlaceId: place.id },
        });

        if (!restaurant) {
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

        // Blacklist 테이블에 이미 존재하는지 확인
        const existingBlacklist = await prisma.blacklist.findUnique({
            where: { userId_restaurantId: { userId, restaurantId } },
        });

        // 존재하면 삭제, 존재하지 않으면 추가
        if (existingBlacklist) {
            await prisma.blacklist.delete({
                where: { userId_restaurantId: { userId, restaurantId } },
            });
            return NextResponse.json({ message: '블랙리스트에서 삭제되었습니다.', action: 'deleted' });
        } else {
            await prisma.blacklist.create({
                data: { userId, restaurantId },
            });
            return NextResponse.json({ message: '블랙리스트에 추가되었습니다.', action: 'created' });
        }
    } catch (error) {
        console.error('블랙리스트 처리 오류:', error);
        return NextResponse.json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}