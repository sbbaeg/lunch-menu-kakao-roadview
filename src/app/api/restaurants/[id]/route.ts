// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';

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
    const restaurant = await prisma.restaurant.findUnique({
      where: { kakaoPlaceId },
      include: {
        taggedBy: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const restaurantWithTags = {
        ...restaurant,
        tags: restaurant.taggedBy.map(t => t.tag)
    };

    // fetchFullGoogleDetails가 요구하는 형태로 객체 생성
    const kakaoPlaceItem = {
        id: restaurant.kakaoPlaceId,
        place_name: restaurant.placeName,
        y: String(restaurant.latitude),
        x: String(restaurant.longitude),
        // 아래는 필수값이지만 현재 로직에선 사용되지 않는 필드들
        place_url: '',
        category_name: restaurant.categoryName || '',
        distance: '',
        phone: '',
        address_name: '',
        road_address_name: restaurant.address || '',
        category_group_code: '',
        category_group_name: '',
    };

    // 생성한 객체로 함수 호출
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