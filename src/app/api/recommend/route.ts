// /api/recommend/route.ts (수정 후 최종 코드)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem } from '@/lib/types';

const prisma = new PrismaClient();

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

    const kakaoSort = sort === 'rating' ? 'accuracy' : sort;

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // ✅ 1. 현재 사용자 세션을 가져옵니다.
    const session = await getServerSession(authOptions);

    try {
        // ✅ 2. 로그인 상태이면, 사용자의 블랙리스트 ID 목록을 DB에서 조회합니다.
        let blacklistIds: string[] = [];
        if (session?.user?.id) {
            const blacklistEntries = await prisma.blacklist.findMany({
                where: { userId: session.user.id },
                select: { restaurant: { select: { kakaoPlaceId: true } } },
            });
            blacklistIds = blacklistEntries.map(entry => entry.restaurant.kakaoPlaceId);
        }

        // 3. 카카오 API에 넉넉하게(최대 45개) 검색을 요청합니다.
        let allResults: KakaoPlaceItem[] = [];
        const categories = query.split(',');
        for (const category of categories) {
            // 한 페이지에 최대 15개씩, 총 3페이지를 호출하여 최대 45개를 가져옵니다.
            for (let page = 1; page <= 3; page++) {
                const response = await fetch(
                    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=15&page=${page}`,
                    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
                );
                const data: { documents?: KakaoPlaceItem[] } = await response.json();
                if (data.documents) {
                    allResults = [...allResults, ...data.documents];
                }
            }
        }
        
        const uniqueResults = allResults.filter(
            (place, index, self) => index === self.findIndex((p) => p.id === place.id)
        );

        // ✅ 4. 카카오 검색 결과에서 블랙리스트에 포함된 항목을 필터링합니다.
        const originalCount = uniqueResults.length;
        const nonBlacklistedResults = uniqueResults.filter(place => !blacklistIds.includes(place.id));
        const excludedCount = originalCount - nonBlacklistedResults.length;
        
        // 5. 요청한 개수(size)만큼 잘라냅니다.
        const slicedResults = nonBlacklistedResults.slice(0, size);

        // 6. 최종 결과에 대해서만 Google 상세 정보를 조회합니다.
        const enrichedResultsPromises = slicedResults.map(place => fetchFullGoogleDetails(place));
        const enrichedResults = await Promise.all(enrichedResultsPromises);

        // 7. '영업 중' 및 '별점' 필터를 적용합니다.
        const filteredByRating = enrichedResults.filter(place => (place.googleDetails?.rating || 0) >= minRating);
        const filteredByOpenStatus = openNow
            ? filteredByRating.filter(place => {
                const hours = place.googleDetails?.opening_hours;
                return hours?.open_now === true || (includeUnknown && hours === undefined);
            })
            : filteredByRating;

        // 8. 최종 정렬
        let finalResults: KakaoPlaceItem[] = [];
        if (sort === 'rating') {
            finalResults = filteredByOpenStatus.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else {
            finalResults = filteredByOpenStatus.sort((a, b) => Number(a.distance) - Number(b.distance));
        }

        return NextResponse.json({
            documents: finalResults,
            excludedCount: excludedCount
        });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}