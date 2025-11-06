// src/app/api/restaurants/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AppRestaurant } from '@/lib/types';

// 식당 정보를 DB에 생성하거나 업데이트하는 POST 요청 핸들러
export async function POST(request: Request) {
  try {
    const restaurant: AppRestaurant = await request.json();

    if (!restaurant || !restaurant.kakaoPlaceId) {
      return NextResponse.json({ error: 'Invalid restaurant data' }, { status: 400 });
    }

    // kakaoPlaceId를 기준으로 식당이 이미 존재하면 업데이트, 없으면 생성 (upsert)
    const upsertedRestaurant = await prisma.restaurant.upsert({
      where: { kakaoPlaceId: restaurant.kakaoPlaceId },
      update: {
        placeName: restaurant.placeName,
        address: restaurant.address,
        latitude: Number(restaurant.y),
        longitude: Number(restaurant.x),
        categoryName: restaurant.categoryName,
      },
      create: {
        kakaoPlaceId: restaurant.kakaoPlaceId,
        placeName: restaurant.placeName,
        address: restaurant.address,
        latitude: Number(restaurant.y),
        longitude: Number(restaurant.x),
        categoryName: restaurant.categoryName,
      },
    });

    return NextResponse.json(upsertedRestaurant);
  } catch (error) {
    console.error('Failed to upsert restaurant:', error);
    return NextResponse.json({ error: 'Failed to upsert restaurant' }, { status: 500 });
  }
}
