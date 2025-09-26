import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
import { KakaoPlaceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

        const categories = query.split(',');
        const fetchedIds = new Set<string>();
        let candidates: KakaoPlaceItem[] = [];
        
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

        // 2. 블랙리스트 필터링 및 제외 개수 계산
        const originalCount = candidates.length;
        candidates = candidates.filter(place => !blacklistIds.includes(place.id));
        const excludedCount = originalCount - candidates.length;

        // 3. 후보군을 하나씩 검증하며 최종 결과를 채워나감
        const finalResults: KakaoPlaceItem[] = [];
        for (const candidate of candidates) {
            if (finalResults.length >= size) break; // 목표 달성 시 즉시 중단

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

        return NextResponse.json({
            documents: sortedResults,
            excludedCount: excludedCount
        });

    } catch (error) {
        console.error('[API Route Error]:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}