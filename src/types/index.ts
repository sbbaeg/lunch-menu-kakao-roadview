// src/types/index.ts

// --- 카카오 지도 객체 타입 ---
export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}
export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  relayout: () => void;
}
export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}
export interface KakaoPolyline {
  setMap: (map: KakaoMap | null) => void;
}
export interface KakaoRoadview {
  setPanoId: (panoId: number, position: KakaoLatLng) => void;
  relayout: () => void;
}
export interface KakaoRoadviewClient {
  getNearestPanoId: (position: KakaoLatLng, radius: number, callback: (panoId: number | null) => void) => void;
}

// --- API 응답 및 데이터 구조 타입 ---
export interface KakaoPlaceItem {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
  googleDetails?: {
    rating?: number;
    photos?: string[];
  }
}
export interface KakaoSearchResponse { documents: KakaoPlaceItem[]; }
export interface RouletteOption { option: string; style?: { backgroundColor?: string; textColor?: string; }; }
export interface GoogleOpeningHours { open_now: boolean; weekday_text?: string[]; }
export interface GoogleDetails { url?: string; photos: string[]; rating?: number; opening_hours?: GoogleOpeningHours; phone?: string; }
export interface DirectionPoint { lat: number; lng: number; }

// --- 전역 window 객체 타입 확장 ---
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number; }) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: { position: KakaoLatLng; }) => KakaoMarker;
        Polyline: new (options: { path: KakaoLatLng[]; strokeColor: string; strokeWeight: number; strokeOpacity: number; }) => KakaoPolyline;
        Roadview: new (container: HTMLElement) => KakaoRoadview;
        RoadviewClient: new () => KakaoRoadviewClient;
        event: {
          addListener: (
            target: KakaoMarker | KakaoMap,
            type: string,
            callback: (mouseEvent?: { latLng: KakaoLatLng }) => void
          ) => void;
        };
      };
    };
  }
}