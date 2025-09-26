// recommend/route.ts (수정 후 최종 코드)

import { NextResponse } from 'next/server';
import { fetchFullGoogleDetails } from '@/lib/googleMaps';
// ✅ 1. 필요한 타입을 lib/types에서 모두 가져옵니다.
import { KakaoPlaceItem, GoogleDetails, Review, GoogleOpeningHours } from '@/lib/types';

// ✅ 2. 파일 내부에 있던 모든 인터페이스 정의를 삭제하여 lib/types.ts와 중복되지 않게 합니다.
//    (만약 다른 곳에서 쓰지 않는 타입이라면 그대로 둬도 괜찮지만, 정리하는 것을 추천합니다.)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || '음식점';
  const radius = searchParams.get('radius') || '800';
  const sort = searchParams.get('sort') || 'accuracy';
  const size = searchParams.get('size') || '5';
  const minRating = Number(searchParams.get('minRating') || '0');

  const openNow = searchParams.get('openNow') === 'true';
  const includeUnknown = searchParams.get('includeUnknown') === 'true';

  const kakaoSort = sort === 'rating' ? 'accuracy' : sort;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const categories = query.split(',');
    // ✅ 3. 변수 타입을 'KakaoPlaceItem[]'으로 명시합니다.
    let allResults: KakaoPlaceItem[] = [];
    const searchSize = Math.min(Number(size) + 10, 15);

    for (const category of categories) {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=${searchSize}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
          },
        }
      );
      // ✅ 4. API 응답 데이터의 타입도 'KakaoPlaceItem'을 사용하도록 수정합니다.
      const data: { documents?: KakaoPlaceItem[] } = await response.json();
      if (data.documents) {
        allResults = [...allResults, ...data.documents];
      }
    }

    const uniqueResults = allResults.filter(
      (place, index, self) => index === self.findIndex((p) => p.id === place.id)
    );

    const enrichedResultsPromises = uniqueResults.map(place => fetchFullGoogleDetails(place));
    const enrichedResults = await Promise.all(enrichedResultsPromises);

    const filteredByRating = enrichedResults.filter(place => 
      (place.googleDetails?.rating || 0) >= minRating
    );

    const filteredByOpenStatus = openNow
      ? filteredByRating.filter(place => {
          const hours = place.googleDetails?.opening_hours;
          // 영업 중이거나, 정보 없는 가게를 포함하는 옵션이 켜져 있으면서 정보가 없는 경우
          return hours?.open_now === true || (includeUnknown && hours === undefined);
        })
      : filteredByRating;

    // ✅ 5. 변수 타입을 'KakaoPlaceItem[]'으로 명시합니다.
    let sortedResults: KakaoPlaceItem[] = [];
    if (sort === 'rating') {
      sortedResults = filteredByOpenStatus.sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
    } else {
      sortedResults = filteredByOpenStatus.sort((a, b) => Number(a.distance) - Number(b.distance));
    }
    
    const finalResults = sortedResults.slice(0, Number(size));

    return NextResponse.json({ documents: finalResults });

  } catch (error) {
    console.error('[API Route Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}