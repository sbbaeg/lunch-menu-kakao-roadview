import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem, RestaurantWithTags } from '@/lib/types';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    console.log("Checking KAKAO_REST_API_KEY:", process.env.KAKAO_REST_API_KEY);
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
    const kakaoSort = sort === 'rating' ? 'accuracy' : sort;

    const tagsParam = searchParams.get('tags');
    const tagIds = tagsParam ? tagsParam.split(',').map(Number).filter(id => !isNaN(id)) : [];

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    try {
        let blacklistIds: string[] = [];
        if (session?.user?.id) {
            const blacklistEntries = await prisma.blacklist.findMany({
                where: { userId: session.user.id },
                select: { restaurant: { select: { kakaoPlaceId: true } } },
            });
            blacklistIds = blacklistEntries.map(entry => entry.restaurant.kakaoPlaceId);
        }

        let taggedRestaurantIds: Set<string> | null = null;
        if (tagIds.length > 0) {
            const taggedRestaurants = await prisma.restaurant.findMany({
                where: {
                    taggedBy: {
                        some: {
                            tagId: { in: tagIds }
                        }
                    }
                },
                select: { kakaoPlaceId: true }
            });
            taggedRestaurantIds = new Set(taggedRestaurants.map(r => r.kakaoPlaceId));
        }

        const categories = query.split(',');
        const fetchedIds = new Set<string>();
        const candidates: KakaoPlaceItem[] = [];
        
        // 1. 카카오 API로 비용이 저렴한 기본 후보군을 넉넉히 확보 (최대 45개)
        for (const category of categories) {
            for (let page = 1; page <= 3; page++) {
                const response = await fetch(
                    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=15&page=${page}`,
                    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
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

        // 2. 블랙리스트와 '태그 필터'를 함께 적용합니다.
        let filteredCandidates = [...candidates]; 

        // 블랙리스트 제외 수 계산
        const countBeforeBlacklist = filteredCandidates.length;
        filteredCandidates = filteredCandidates.filter(place => !blacklistIds.includes(place.id));
        const blacklistExcludedCount = countBeforeBlacklist - filteredCandidates.length;

        // 태그 필터 제외 수 계산 (태그 필터가 있을 경우에만)
        let tagExcludedCount = 0;
        if (taggedRestaurantIds) {
            const countBeforeTagFilter = filteredCandidates.length;
            filteredCandidates = filteredCandidates.filter(place => taggedRestaurantIds!.has(place.id));
            tagExcludedCount = countBeforeTagFilter - filteredCandidates.length;
        }

        // 3. 후보군을 하나씩 검증하며 최종 결과를 채워나감
        const finalResults: KakaoPlaceItem[] = [];
        for (const candidate of filteredCandidates) {
            if (finalResults.length >= size) break;

            const enriched = await fetchFullGoogleDetails(candidate);

            const ratingMatch = (enriched.googleDetails?.rating || 0) >= minRating;
            if (!ratingMatch) continue; // 별점 필터 탈락 시 다음 후보로

            if (openNow) {
                const hours = enriched.googleDetails?.opening_hours;
                const isOpen = hours?.open_now === true || (includeUnknown && hours === undefined);
                if (!isOpen) continue; // 영업 중 필터 탈락 시 다음 후보로
            }

            // 모든 필터 통과 시 최종 결과에 추가
            finalResults.push(enriched);
        }

        let sortedResults: KakaoPlaceItem[] = [];
        if (sort === 'rating') {
            sortedResults = finalResults.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else {
            sortedResults = finalResults;
        }

        const resultIds = sortedResults.map(r => r.id);

        const restaurantsWithTags = await prisma.restaurant.findMany({
            where: { kakaoPlaceId: { in: resultIds } },
            include: {
                taggedBy: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        const finalDocuments: RestaurantWithTags[] = sortedResults.map(result => {
            const match = restaurantsWithTags.find(r => r.kakaoPlaceId === result.id);
            return {
                ...result,
                tags: match ? match.taggedBy.map(t => t.tag) : []
            };
        });

        return NextResponse.json({
            documents: finalDocuments,
            blacklistExcludedCount: blacklistExcludedCount,
            tagExcludedCount: tagExcludedCount
        });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}