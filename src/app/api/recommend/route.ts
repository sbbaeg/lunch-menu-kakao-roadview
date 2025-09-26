// app/api/recommend/route.ts (GET 함수 전체 교체)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem } from '@/lib/types';

export const dynamic = 'force-dynamic'; // 캐싱 방지

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

        let finalResults: KakaoPlaceItem[] = [];
        let fetchedResults = new Set<string>(); // 중복 체크용
        let excludedCount = 0;
        const categories = query.split(',');

        // ✅ 요청한 개수(size)를 채울 때까지 카카오 API 페이지를 넘기며 검색
        for (const category of categories) {
            for (let page = 1; page <= 3; page++) {
                if (finalResults.length >= size) break;

                const response = await fetch(
                    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=15&page=${page}`,
                    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
                );
                const data: { documents?: KakaoPlaceItem[] } = await response.json();
                
                if (!data.documents) continue;

                for (const place of data.documents) {
                    if (finalResults.length >= size) break;
                    if (fetchedResults.has(place.id)) continue;

                    fetchedResults.add(place.id);

                    if (blacklistIds.includes(place.id)) {
                        excludedCount++;
                    } else {
                        finalResults.push(place);
                    }
                }
            }
            if (finalResults.length >= size) break;
        }

        // 최종 결과에 대해서만 Google 상세 정보 조회 및 추가 필터링
        const enrichedResultsPromises = finalResults.map(place => fetchFullGoogleDetails(place));
        const enrichedResults = await Promise.all(enrichedResultsPromises);

        const filteredByRating = enrichedResults.filter(place => (place.googleDetails?.rating || 0) >= minRating);
        const filteredByOpenStatus = openNow
            ? filteredByRating.filter(place => {
                const hours = place.googleDetails?.opening_hours;
                return hours?.open_now === true || (includeUnknown && hours === undefined);
            })
            : filteredByRating;

        let sortedResults: KakaoPlaceItem[] = [];
        if (sort === 'rating') {
            sortedResults = filteredByOpenStatus.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else {
            sortedResults = filteredByOpenStatus; // 카카오 API에서 이미 distance 또는 accuracy로 정렬됨
        }

        return NextResponse.json({
            documents: sortedResults,
            excludedCount: excludedCount
        });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}