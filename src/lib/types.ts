import { VoteType, Badge } from '@prisma/client';

export interface GoogleOpeningHours {
  openNow: boolean;
  weekdayDescriptions?: string[];
}

export interface Review {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export interface GoogleParkingOptions {
  freeParkingLot?: boolean;
  paidParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
  freeGarageParking?: boolean;
  paidGarageParking?: boolean;
}

export interface GoogleDetails {
  placeId?: string;
  url?: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
  opening_hours?: GoogleOpeningHours;
  phone?: string;
  reviews?: Review[];
  dine_in?: boolean;
  takeout?: boolean;
  allowsDogs?: boolean;
  parkingOptions?: GoogleParkingOptions;
  wheelchairAccessibleParking?: boolean;
  wheelchairAccessibleEntrance?: boolean;
  wheelchairAccessibleRestroom?: boolean;
  wheelchairAccessibleSeating?: boolean;
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
  needsModeration: boolean;
  user: {
    name: string | null;
    image: string | null;
    isBanned: boolean;
    featuredBadges: Badge[];
  };
  upvotes: number;
  downvotes: number;
  currentUserVote: VoteType | null;
}

// 우리 앱의 태그 리뷰 정보 타입 (프론트엔드용)
export interface AppTagReview {
  id: number;
  rating: number;
  text: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

// Google API 원본 데이터 타입 (이제 Google Place ID를 사용)
export interface GooglePlaceItem {
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
export interface RestaurantWithTags extends GooglePlaceItem {
  tags: Tag[];
  appReview?: AppReviewSummary;
}

// 우리 앱 내부에서 사용할 표준 데이터 타입 (camelCase)
export interface AppRestaurant {
  id: string;
  dbId?: number; // DB auto-increment ID
  googlePlaceId: string; // Google Place ID
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
  likeCount?: number;   // 우선 옵셔널(?)로 추가 (나중에 필수로 변경 가능)
  dislikeCount?: number; // 우선 옵셔널(?)로 추가 (나중에 필수로 변경 가능)
  currentUserVote?: VoteType | null;
}