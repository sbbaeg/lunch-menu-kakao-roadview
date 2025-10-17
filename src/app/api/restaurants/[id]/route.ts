// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getGooglePlaceDetails } from '@/lib/googleMaps';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
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

    // 기존 Restaurant 타입을 AppRestaurant 타입과 유사하게 변환
    const restaurantWithTags = {
        ...restaurant,
        tags: restaurant.taggedBy.map(t => t.tag)
    };

    // 구글 상세 정보 추가
    const googleDetails = await getGooglePlaceDetails(restaurant.kakaoPlaceId);
    const finalRestaurantData = {
        ...restaurantWithTags,
        googleDetails,
    };


    return NextResponse.json(finalRestaurantData);
  } catch (error) {
    console.error('Failed to fetch restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant details' }, { status: 500 });
  }
}
