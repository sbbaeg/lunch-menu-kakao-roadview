// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, VoteType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem, AppRestaurant } from '@/lib/types';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const kakaoPlaceId = params.id;

  if (!kakaoPlaceId) {
    return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const restaurantFromDb = await prisma.restaurant.findUnique({
      where: { kakaoPlaceId },
      include: {
        taggedBy: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!restaurantFromDb) {
      return NextResponse.json({ error: 'Restaurant not found in our DB. It should be created first.' }, { status: 404 });
    }

    // 앱 리뷰 평균 및 개수 계산
    const reviewAggregations = await prisma.review.aggregate({
      where: {
        restaurantId: restaurantFromDb.id,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const appReview = {
      averageRating: reviewAggregations._avg.rating || 0,
      reviewCount: reviewAggregations._count.id,
    };

    let currentUserVote: VoteType | null = null;
    if (userId && restaurantFromDb) { // userId와 restaurantFromDb.id 둘 다 있어야 조회 가능
      const vote = await prisma.restaurantVote.findUnique({
        // userId와 restaurantId 복합 키로 조회
        where: { userId_restaurantId: { userId: userId, restaurantId: restaurantFromDb.id } },
        select: { type: true } // 투표 타입('UPVOTE' or 'DOWNVOTE')만 가져옴
      });
      currentUserVote = vote?.type || null; // 조회 결과가 있으면 type을, 없으면 null을 할당
    }

    const kakaoPlaceItem: KakaoPlaceItem = {
        id: restaurantFromDb.kakaoPlaceId,
        place_name: restaurantFromDb.placeName,
        y: String(restaurantFromDb.latitude),
        x: String(restaurantFromDb.longitude),
        place_url: `https://place.map.kakao.com/${restaurantFromDb.kakaoPlaceId}`,
        category_name: restaurantFromDb.categoryName || '',
        road_address_name: restaurantFromDb.address || '',
        address_name: restaurantFromDb.address || '',
        distance: '',
    };

    const restaurantWithGoogleDetails = await fetchFullGoogleDetails(kakaoPlaceItem);

    // 프론트엔드 AppRestaurant 타입에 맞게 최종 데이터 구조를 명시적으로 조립
    const finalRestaurantData: AppRestaurant = {
      id: restaurantFromDb.kakaoPlaceId, // id를 kakaoPlaceId로 설정
      dbId: restaurantFromDb.id, // DB의 auto-increment id 추가
      kakaoPlaceId: restaurantFromDb.kakaoPlaceId,
      placeName: restaurantFromDb.placeName,
      categoryName: restaurantFromDb.categoryName || '',
      address: restaurantFromDb.address || '',
      x: String(restaurantFromDb.longitude),
      y: String(restaurantFromDb.latitude),
      placeUrl: `https://place.map.kakao.com/${restaurantFromDb.kakaoPlaceId}`,
      distance: '', // 상세 페이지에서는 거리 정보가 필요 없음
      tags: restaurantFromDb.taggedBy.map(t => ({
        id: t.tag.id,
        name: t.tag.name,
        isPublic: t.tag.isPublic,
        creatorId: t.tag.userId,
        creatorName: null // 이 정보는 별도 조인이 필요하므로 여기서는 null 처리
      })),
      googleDetails: restaurantWithGoogleDetails.googleDetails,
      appReview: appReview, // 계산된 앱 리뷰 정보 추가

      likeCount: restaurantFromDb.likeCount,
      dislikeCount: restaurantFromDb.dislikeCount,

      // ⬇️ 6. 4단계에서 조회한 currentUserVote 추가
      currentUserVote: currentUserVote,
    };

    return NextResponse.json(finalRestaurantData);
  } catch (error) {
    console.error('Failed to fetch restaurant details:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant details' }, { status: 500 });
  }
}