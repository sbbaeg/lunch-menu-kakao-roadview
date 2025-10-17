// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem } from '@/lib/types';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const kakaoPlaceId = params.id;

  if (!kakaoPlaceId) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  try {
    // 1. 우리 DB에서 식당 정보 찾기
    let restaurant = await prisma.restaurant.findUnique({
      where: { kakaoPlaceId },
      include: {
        taggedBy: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 2. DB에 식당이 없을 경우, 카카오 API를 통해 정보 조회 (이 부분은 아직 구현되지 않음)
    // 현재는 DB에 없는 경우 404가 발생하므로, 클라이언트에서 생성 요청을 먼저 보내는 로직이 필요함.
    // 이번 수정에서는 우선 DB 조회 로직만 유지하고, 클라이언트 측 수정을 다음 단계로 진행합니다.
    if (!restaurant) {
        // 임시: 만약 DB에 없다면, 카카오 검색으로 기본 정보를 가져와야 하지만, 
        // 현재 ID만으로는 카카오 검색이 어려우므로 일단 404를 반환합니다. 
        // 이 문제는 다음 단계에서 '상세보기' 버튼 로직을 수정하여 해결합니다.
      return NextResponse.json({ error: 'Restaurant not found in our DB. It should be created first.' }, { status: 404 });
    }

    const restaurantWithTags = {
        ...restaurant,
        tags: restaurant.taggedBy.map(t => t.tag)
    };

    // 3. 구글 상세 정보 추가
    const kakaoPlaceItem: KakaoPlaceItem = {
        id: restaurant.kakaoPlaceId,
        place_name: restaurant.placeName,
        y: String(restaurant.latitude),
        x: String(restaurant.longitude),
        place_url: `https://place.map.kakao.com/${restaurant.kakaoPlaceId}`,
        category_name: restaurant.categoryName || '',
        distance: '', // 상세 페이지에서는 거리 정보가 필요 없음
        address_name: restaurant.address || '',
        road_address_name: restaurant.address || '',
        category_group_code: '',
        category_group_name: '',
    };

    const restaurantWithGoogleDetails = await fetchFullGoogleDetails(kakaoPlaceItem);

    const finalRestaurantData = {
        ...restaurantWithTags,
        googleDetails: restaurantWithGoogleDetails.googleDetails,
    };

    return NextResponse.json(finalRestaurantData);
  } catch (error) {
    console.error('Failed to fetch restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant details' }, { status: 500 });
  }
}
