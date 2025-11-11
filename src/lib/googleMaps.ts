// src/lib/googleMaps.ts

import { KakaoPlaceItem, Review, GoogleOpeningHours } from './types';

// Google API 응답 결과에 대한 타입 정의
interface GooglePhoto {
  photo_reference: string;
}

interface GoogleParkingOptions {
  freeParkingLot?: boolean;
  paidParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
  freeGarageParking?: boolean;
  paidGarageParking?: boolean;
}

interface GooglePlaceDetailsResult {
  url?: string;
  rating?: number;
  photos?: GooglePhoto[];
  opening_hours?: GoogleOpeningHours;
  formatted_phone_number?: string;
  reviews?: Review[];
  dine_in?: boolean;
  takeout?: boolean;
  allows_dogs?: boolean;
  parking_options?: GoogleParkingOptions;
}

export async function fetchFullGoogleDetails(place: KakaoPlaceItem): Promise<KakaoPlaceItem> {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Google API Key is not configured");

    // 1. 장소 이름과 위치 정보로 Google Place ID 검색
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(place.place_name)}&inputtype=textquery&fields=place_id&locationbias=point:${place.y},${place.x}&key=${GOOGLE_API_KEY}`;
    const findPlaceResponse = await fetch(findPlaceUrl);
    const findPlaceData = await findPlaceResponse.json();
    
    // ⭐ 누락되었던 'placeId' 선언 부분입니다.
    const placeId = findPlaceData.candidates?.[0]?.place_id;

    if (!placeId) return place; // 구글에서 장소를 못 찾으면 카카오 정보만 반환

    // 2. Place ID로 상세 정보 요청
    const fields = 'url,photos,rating,opening_hours,formatted_phone_number,reviews,dine_in,takeout,allows_dogs,parking_options';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}&language=ko`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData: { result?: GooglePlaceDetailsResult } = await detailsResponse.json();
    const result = detailsData.result;
    
    if (!result) return place; // 상세 정보 없으면 카카오 정보만 반환

    const photos = result.photos?.map(p => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_API_KEY}`
    ) || [];

    return {
      ...place,
      googleDetails: {
        url: result.url,
        rating: result.rating,
        photos,
        opening_hours: result.opening_hours,
        phone: result.formatted_phone_number,
        reviews: result.reviews,
        dine_in: result.dine_in,
        takeout: result.takeout,
        allowsDogs: result.allows_dogs,
        parkingOptions: result.parking_options,
      }
    };
  } catch (error) {
    console.error(`[Google API Error] for ${place.place_name}:`, error);
    return place; // 에러 발생 시 원본 카카오 정보 유지
  }
}