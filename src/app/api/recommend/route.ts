import { NextResponse } from 'next/server';

// --- 타입 정의 ---

// 카카오 API 응답 기본 타입
interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  place_url: string;
  distance: string;
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
}

// 구글 상세 정보를 포함한 최종 응답 타입
interface EnrichedPlace extends KakaoPlace {
  googleDetails?: {
    rating?: number;
    photos?: string[];
  }
}

// 구글 API 응답 타입 (내부용)
interface GooglePlaceDetailsResult {
  rating?: number;
  photos?: { photo_reference: string }[];
}

// --- 로직 시작 ---

/**
 * 주어진 장소(KakaoPlace)에 대한 Google 상세 정보(별점, 사진)를 조회하는 헬퍼 함수
 * @param place - 카카오 API에서 받은 장소 정보
 * @returns EnrichedPlace - 구글 정보가 추가된 장소 정보
 */
async function fetchGoogleDetails(place: KakaoPlace): Promise<EnrichedPlace> {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Google API Key is not configured");

    // 1. 장소 이름으로 Google Place ID 검색
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(place.place_name)}&inputtype=textquery&fields=place_id&locationbias=point:${place.y},${place.x}&key=${GOOGLE_API_KEY}`;
    const findPlaceResponse = await fetch(findPlaceUrl);
    const findPlaceData = await findPlaceResponse.json();
    const placeId = findPlaceData.candidates?.[0]?.place_id;

    if (!placeId) {
      return place; // 구글에서 장소를 찾지 못하면 카카오 정보만 반환
    }

    // 2. Place ID로 상세 정보(별점, 사진) 요청
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,photos&key=${GOOGLE_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData: { result?: GooglePlaceDetailsResult } = await detailsResponse.json();
    const result = detailsData.result;

    if (!result) {
      return place; // 상세 정보가 없으면 카카오 정보만 반환
    }

    const photos = result.photos?.slice(0, 5).map(p => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_API_KEY}`
    ) || [];

    return {
      ...place,
      googleDetails: {
        rating: result.rating,
        photos,
      }
    };
  } catch (error) {
    console.error(`[Google API Error] for ${place.place_name}:`, error);
    return place; // 구글 정보 조회 중 에러 발생 시, 원본 카카오 정보는 그대로 유지
  }
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || '음식점';
  const radius = searchParams.get('radius') || '800';
  const sort = searchParams.get('sort') || 'accuracy';
  const size = searchParams.get('size') || '5';
  const minRating = Number(searchParams.get('minRating') || '0');

  // [수정] 카카오 API는 'rating' 정렬을 지원하지 않으므로, 'accuracy'로 대체하여 후보군을 가져옵니다.
  const kakaoSort = sort === 'rating' ? 'accuracy' : sort;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    // 1. 카카오 API로 카테고리별 검색 및 중복 제거
    const categories = query.split(',');
    let allResults: KakaoPlace[] = [];
    const searchSize = Math.min(Number(size) + 10, 15);

    for (const category of categories) {
      const response = await fetch(
        // [수정] fetch URL의 sort 값을 kakaoSort로 변경
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(category.trim())}&y=${lat}&x=${lng}&radius=${radius}&sort=${kakaoSort}&size=${searchSize}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
          },
        }
      );
      const data: KakaoSearchResponse = await response.json();
      if (data.documents) {
        allResults = [...allResults, ...data.documents];
      }
    }

    const uniqueResults = allResults.filter(
      (place, index, self) => index === self.findIndex((p) => p.id === place.id)
    );

    // 2. Google 상세 정보 조회 및 별점 필터링
    const enrichedResultsPromises = uniqueResults.map(place => fetchGoogleDetails(place));
    const enrichedResults = await Promise.all(enrichedResultsPromises);

    const filteredByRating = enrichedResults.filter(place => 
      (place.googleDetails?.rating || 0) >= minRating
    );

    // 3. 최종 처리: 정렬 및 개수 제한
    let sortedResults: EnrichedPlace[] = [];

    if (sort === 'rating') {
      // '별점 순'일 경우: 별점(rating) 기준으로 내림차순 정렬 (높은 별점이 먼저)
      sortedResults = filteredByRating.sort((a, b) => 
        (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0)
      );
    } else {
      // '가까운 순' 또는 '정확도 순'일 경우: 거리(distance) 기준으로 오름차순 정렬
      sortedResults = filteredByRating.sort((a, b) => 
        Number(a.distance) - Number(b.distance)
      );
    }
    
    const finalResults = sortedResults.slice(0, Number(size));

    return NextResponse.json({ documents: finalResults });

  } catch (error) {
    console.error('[API Route Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}