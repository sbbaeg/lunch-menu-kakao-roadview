// api/recommend/route.ts (수정)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem, RestaurantWithTags } from '@/lib/types';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// 두 지점 간의 거리를 미터(m) 단위로 계산하는 함수
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const query = searchParams.get('query') || '음식점';
    const radius = searchParams.get('radius') || '800';
    const sort = searchParams.get('sort') || 'accuracy';
    const size = Number(searchParams.get('size') || '5');
    const minRating = Number(searchParams.get('minRating') || '0');
    const openNow = searchParams.get('openNow') === 'true';
    const includeUnknown = searchParams.get('includeUnknown') === 'true';
    const fromFavorites = searchParams.get('fromFavorites') === 'true';
    const kakaoSort = sort === 'rating' ? 'accuracy' : sort;

    const tagsParam = searchParams.get('tags');
    const tagIds = tagsParam ? tagsParam.split(',').map(Number).filter(id => !isNaN(id)) : [];

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let blacklistIds: string[] = [];
    if (session?.user?.id) {
        const blacklistEntries = await prisma.blacklist.findMany({
            where: { userId: session.user.id },
            select: { restaurant: { select: { kakaoPlaceId: true } } },
        });
        blacklistIds = blacklistEntries.map(entry => entry.restaurant.kakaoPlaceId);
    }
    
    try {
        let candidates: KakaoPlaceItem[] = [];

        if (fromFavorites && session?.user?.id) {
            // ✅ 1. DB에서 사용자의 모든 즐겨찾기 목록을 좌표 정보와 함께 가져옵니다.
            const favoriteRestaurants = await prisma.favorite.findMany({
                where: { userId: session.user.id },
                include: { restaurant: true },
            });
            
            // ✅ 2. 현재 위치와의 거리를 계산하여 반경 내에 있는 즐겨찾기만 필터링합니다.
            candidates = favoriteRestaurants
                .map(({ restaurant }) => ({
                    ...restaurant,
                    calculatedDistance: calculateDistance(Number(lat), Number(lng), restaurant.latitude!, restaurant.longitude!),
                }))
                .filter(restaurant => restaurant.calculatedDistance <= Number(radius))
                .map(restaurant => ({
                    id: restaurant.kakaoPlaceId,
                    place_name: restaurant.placeName,
                    category_name: restaurant.categoryName || '',
                    road_address_name: restaurant.address || '',
                    address_name: restaurant.address || '',
                    x: String(restaurant.longitude),
                    y: String(restaurant.latitude),
                    place_url: `https://place.map.kakao.com/${restaurant.kakaoPlaceId}`,
                    distance: String(Math.round(restaurant.calculatedDistance)),
                }));

        } else {
            // ✅ 기존의 일반 검색 로직 (카카오 API 호출)
            const categories = query.split(',');
            const fetchedIds = new Set<string>();
            for (const category of categories) {
                for (let page = 1; page <= 3; page++) {
                    const response = await fetch(
                        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=15&page=${page}`,
                        {
                            headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
                            cache: 'no-store' 
                        }
                    );
                    const data: { documents?: KakaoPlaceItem[] } = await response.json();
                    if (data.documents) {
                        for (const place of data.documents) {
                            if (!fetchedIds.has(place.id)) {
                                fetchedIds.add(place.id);
                                candidates.push(place);
                            }
                        }
                    }
                }
            }
        }

        // ✅ 이하 로직은 '즐겨찾기 검색'과 '일반 검색'의 공통 로직입니다.
        let tagExcludedCount = 0;
        let taggedRestaurantIds: Set<string> | null = null;
        if (tagIds.length > 0) {
            const taggedRestaurants = await prisma.restaurant.findMany({
                where: {
                    taggedBy: { some: { tagId: { in: tagIds } } },
                    // 즐겨찾기 검색 시, 후보군이 이미 즐겨찾기 목록이므로 추가 필터링 불필요.
                    // 일반 검색 시에는 모든 레스토랑을 대상으로 검색.
                    ...(fromFavorites ? { kakaoPlaceId: { in: candidates.map(c => c.id) } } : {})
                },
                select: { kakaoPlaceId: true }
            });
            taggedRestaurantIds = new Set(taggedRestaurants.map(r => r.kakaoPlaceId));
        }

        const countBeforeBlacklist = candidates.length;
        let filteredCandidates = candidates.filter(place => !blacklistIds.includes(place.id));
        const blacklistExcludedCount = countBeforeBlacklist - filteredCandidates.length;

        if (taggedRestaurantIds) {
            const countBeforeTagFilter = filteredCandidates.length;
            filteredCandidates = filteredCandidates.filter(place => taggedRestaurantIds!.has(place.id));
            tagExcludedCount = countBeforeTagFilter - filteredCandidates.length;
        }

        if (sort === 'accuracy') {
            // 후보군을 무작위로 섞습니다. (Fisher-Yates shuffle)
            for (let i = filteredCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredCandidates[i], filteredCandidates[j]] = [filteredCandidates[j], filteredCandidates[i]];
            }
        }

        const finalResults: KakaoPlaceItem[] = [];
        for (const candidate of filteredCandidates) {
            if (finalResults.length >= size) break;

            const enriched = await fetchFullGoogleDetails(candidate);
            const ratingMatch = (enriched.googleDetails?.rating || 0) >= minRating;
            if (!ratingMatch) continue;

            if (openNow) {
                const hours = enriched.googleDetails?.opening_hours;
                const isOpen = hours?.open_now === true || (includeUnknown && hours === undefined);
                if (!isOpen) continue;
            }
            finalResults.push(enriched);
        }

        let sortedResults: KakaoPlaceItem[] = [];
        if (sort === 'rating') {
            sortedResults = finalResults.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else if (sort === 'distance' && fromFavorites) {
            // 즐겨찾기 검색 시 거리순 정렬은 계산된 거리를 사용
            sortedResults = finalResults.sort((a, b) => Number(a.distance) - Number(b.distance));
        } else {
            sortedResults = finalResults;
        }

        const resultIds = sortedResults.map(r => r.id);

        // DB에서 태그 정보와 레스토랑 ID를 가져옵니다.
        const dbRestaurants = await prisma.restaurant.findMany({
            where: { kakaoPlaceId: { in: resultIds } },
            include: {
                taggedBy: {
                    include: {
                        tag: { 
                            include: { 
                                user: { select: { id: true, name: true } },
                                _count: { 
                                    select: { restaurants: true, subscribers: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        const dbRestaurantMap = new Map(dbRestaurants.map(r => [r.kakaoPlaceId, r]));

        // 리뷰 평점 및 개수 집계
        const reviewAggregations = await prisma.review.groupBy({
            by: ['restaurantId'],
            where: {
                restaurantId: { in: dbRestaurants.map(r => r.id) },
            },
            _avg: {
                rating: true,
            },
            _count: {
                id: true,
            },
        });
        const reviewAggsMap = new Map(reviewAggregations.map(agg => [agg.restaurantId, agg]));

        // 최종 데이터 조합
        const finalDocuments: (RestaurantWithTags & { likeCount: number, dislikeCount: number })[] = sortedResults.map(result => {
            const dbRestaurant = dbRestaurantMap.get(result.id);
            const reviewAggs = dbRestaurant ? reviewAggsMap.get(dbRestaurant.id) : null;

            return {
                ...result,
                tags: dbRestaurant ? dbRestaurant.taggedBy.map(t => ({ 
                    id: t.tag.id, 
                    name: t.tag.name, 
                    isPublic: t.tag.isPublic, 
                    creatorId: t.tag.user.id, 
                    creatorName: t.tag.user.name,
                    restaurantCount: t.tag._count.restaurants,
                    subscriberCount: t.tag._count.subscribers
                })) : [],
                appReview: reviewAggs ? {
                    averageRating: reviewAggs._avg.rating || 0,
                    reviewCount: reviewAggs._count.id,
                } : undefined,
                
                likeCount: dbRestaurant?.likeCount ?? 0,
                dislikeCount: dbRestaurant?.dislikeCount ?? 0,
            };
        });

        return NextResponse.json({ documents: finalDocuments, blacklistExcludedCount, tagExcludedCount });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}