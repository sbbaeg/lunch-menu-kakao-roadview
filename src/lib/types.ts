import { VoteType } from '@prisma/client';

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

// 우리 앱의 리뷰 요약 정보 타입
export interface AppReviewSummary {
  averageRating: number;
  reviewCount: number;
}

// 우리 앱의 개별 리뷰 정보 타입 (프론트엔드용)
export interface AppReview {
  id: number;
  rating: number;
  text: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  };
  upvotes: number;
  downvotes: number;
  currentUserVote: VoteType | null;
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

export interface Tag {
    id: number;
    name: string;
    isPublic: boolean;
    creatorId: string;
    creatorName: string | null;
    restaurantCount?: number;
    subscriberCount?: number;
}

// API 응답에 최종적으로 사용될 타입
export interface RestaurantWithTags extends KakaoPlaceItem {
  tags: Tag[];
  appReview?: AppReviewSummary;
}

// 우리 앱 내부에서 사용할 표준 데이터 타입 (camelCase)
export interface AppRestaurant {
  id: string; // kakaoPlaceId
  dbId?: number; // DB auto-increment ID
  kakaoPlaceId: string;
  placeName: string;
  categoryName: string;
  address: string;
  x: string;
  y: string;
  distance: string;
  placeUrl: string;
  googleDetails?: GoogleDetails;
  appReview?: AppReviewSummary; // 앱 리뷰 요약 정보
  tags?: Tag[];
}