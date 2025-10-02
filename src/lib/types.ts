// lib/types.ts

export interface GoogleOpeningHours {
  open_now: boolean;
  weekday_text?: string[];
}

export interface Review {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export interface GoogleDetails {
  url?: string;
  photos: string[];
  rating?: number;
  opening_hours?: GoogleOpeningHours;
  phone?: string;
  reviews?: Review[];
  dine_in?: boolean;
  takeout?: boolean;
}

// 카카오 API 원본 데이터 타입
export interface KakaoPlaceItem {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
  googleDetails?: GoogleDetails;
}

// API 응답에 최종적으로 사용될 타입
export interface RestaurantWithTags extends KakaoPlaceItem {
  tags: { id: number; name: string; }[];
}

// 우리 앱 내부에서 사용할 표준 데이터 타입 (camelCase)
export interface Restaurant {
  id: string; // kakaoPlaceId
  placeName: string;
  categoryName: string;
  address: string;
  x: string;
  y: string;
  distance: string;
  placeUrl: string;
  googleDetails?: GoogleDetails;
  tags?: { id: number; name: string; }[];
}