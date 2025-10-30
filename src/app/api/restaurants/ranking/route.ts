
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { AppRestaurant, KakaoPlaceItem } from '@/lib/types';

const prisma = new PrismaClient();

const MIN_LIKE_COUNT_THRESHOLD = 1; // 최소 좋아요 개수
const TOP_N = 20; // 상위 N개

export async function GET(request: Request) {
  try {
    // 1. 최소 좋아요 개수를 만족하는 음식점 조회
    const candidateRestaurants = await prisma.restaurant.findMany({
      where: {
        likeCount: {
          gte: MIN_LIKE_COUNT_THRESHOLD,
        },
      },
    });

    // 2. 좋아요 비율 계산 및 정렬
    const rankedRestaurants = candidateRestaurants
      .map(r => {
        const totalVotes = r.likeCount + r.dislikeCount;
        const likePercentage = totalVotes > 0 ? r.likeCount / totalVotes : 0;
        return { ...r, likePercentage };
      })
      .sort((a, b) => {
        // 주요 정렬: 좋아요 비율 (내림차순)
        if (b.likePercentage !== a.likePercentage) {
          return b.likePercentage - a.likePercentage;
        }
        // 보조 정렬: 좋아요 개수 (내림차순)
        return b.likeCount - a.likeCount;
      })
      .slice(0, TOP_N);

    // 3. 상세 정보(googleDetails 등)를 포함한 전체 데이터 조회
    const detailedRankedRestaurants = await Promise.all(
      rankedRestaurants.map(async (r) => {
        try {
          // /api/restaurants/[id] 와 유사한 로직으로 전체 데이터 구성
          const kakaoPlaceItem: KakaoPlaceItem = {
            id: r.kakaoPlaceId,
            place_name: r.placeName,
            y: String(r.latitude),
            x: String(r.longitude),
            place_url: `https://place.map.kakao.com/${r.kakaoPlaceId}`,
            category_name: r.categoryName || '',
            road_address_name: r.address || '',
            address_name: r.address || '',
            distance: '',
          };

          const restaurantWithGoogleDetails = await fetchFullGoogleDetails(kakaoPlaceItem);

          const reviewAggregations = await prisma.review.aggregate({
            where: { restaurantId: r.id },
            _avg: { rating: true },
            _count: { id: true },
          });

          const finalRestaurantData: AppRestaurant = {
            id: r.kakaoPlaceId,
            dbId: r.id,
            kakaoPlaceId: r.kakaoPlaceId,
            placeName: r.placeName,
            categoryName: r.categoryName || '',
            address: r.address || '',
            x: String(r.longitude),
            y: String(r.latitude),
            placeUrl: `https://place.map.kakao.com/${r.kakaoPlaceId}`,
            distance: '',
            tags: [], // 랭킹 페이지에서는 태그 정보를 일단 제외
            googleDetails: restaurantWithGoogleDetails.googleDetails,
            appReview: {
              averageRating: reviewAggregations._avg.rating || 0,
              reviewCount: reviewAggregations._count.id,
            },
            likeCount: r.likeCount,
            dislikeCount: r.dislikeCount,
            currentUserVote: null, // 랭킹 목록에서는 개별 투표 정보 미제공
          };
          return finalRestaurantData;
        } catch (error) {
          console.error(`Failed to fetch details for restaurant ${r.id}:`, error);
          return null; // 개별 실패 시 null 반환
        }
      })
    );

    // null이 아닌 결과만 필터링하여 최종 응답
    const finalResult = detailedRankedRestaurants.filter(Boolean);

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Failed to fetch restaurant ranking:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant ranking' }, { status: 500 });
  }
}
