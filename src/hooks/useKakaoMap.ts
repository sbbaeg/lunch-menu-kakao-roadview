// hooks/useKakaoMap.ts (수정)

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant } from '@/lib/types';

// Kakao 타입 정의 (이전과 동일)
declare namespace kakao.maps {
    class LatLng { constructor(lat: number, lng: number); getLat(): number; getLng(): number; }
    class LatLngBounds { constructor(); extend(latlng: LatLng): void; }
    class Map { constructor(container: HTMLElement, options: { center: LatLng; level: number }); setCenter(latlng: LatLng): void; relayout(): void; getCenter(): LatLng; setBounds(bounds: LatLngBounds): void; }
    class Marker { constructor(options: { position: LatLng }); setMap(map: Map | null): void; }
    class Polyline { constructor(options: { path: LatLng[]; strokeColor: string; strokeWeight: number; strokeOpacity: number; }); setMap(map: Map | null): void; }
    class Roadview { constructor(container: HTMLElement); setPanoId(panoId: number, position: LatLng): void; relayout(): void; }
    class RoadviewClient { constructor(); getNearestPanoId( position: LatLng, radius: number, callback: (panoId: number | null) => void ): void; }
    namespace event { function addListener(target: kakao.maps.Map | kakao.maps.Marker, type: string, handler: () => void): void; function removeListener(target: kakao.maps.Map | kakao.maps.Marker, type: string, handler: () => void): void; }
    namespace services {
        interface PlacesSearchResultItem { id: string; y: string; x: string; place_name: string; road_address_name: string; category_name: string; place_url: string; distance: string; }
        type PlacesSearchResult = PlacesSearchResultItem[];
        interface Pagination { totalCount: number; hasNextPage: boolean; hasPrevPage: boolean; current: number; nextPage(): void; prevPage(): void; gotoPage(page: number): void; }
        class Places { constructor(); keywordSearch( keyword: string, callback: ( data: PlacesSearchResult, status: Status, pagination: Pagination ) => void, options?: { location?: LatLng; radius?: number; } ): void; }
        enum Status { OK = 'OK', ZERO_RESULT = 'ZERO_RESULT', ERROR = 'ERROR', }
    }
}
declare global {
    interface Window { kakao: { maps: { load: (callback: () => void) => void; services: typeof kakao.maps.services; event: typeof kakao.maps.event; } & typeof kakao.maps; }; }
}

interface DirectionPoint { lat: number; lng: number; }

export function useKakaoMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<kakao.maps.Map | null>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const markers = useRef<kakao.maps.Marker[]>([]);
    const polylineInstance = useRef<kakao.maps.Polyline | null>(null);
    const roadviewContainer = useRef<HTMLDivElement | null>(null);
    const roadviewInstance = useRef<kakao.maps.Roadview | null>(null);
    const roadviewClient = useRef<kakao.maps.RoadviewClient | null>(null);
    const isMapReady = useAppStore((state) => state.isMapReady);

    // ✅ 지도 인스턴스 생성 useEffect
    useEffect(() => {
        if (isMapReady && mapContainer.current && !mapInstance.current) {
            const mapOption = {
                center: new window.kakao.maps.LatLng(36.3504, 127.3845),
                level: 5,
            };
            mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption);
            setIsMapInitialized(true);
        }
    }, [isMapReady]);

    // ✅ 로드뷰 인스턴스 생성 useEffect (분리)
    useEffect(() => {
        if (isMapReady && roadviewContainer.current && !roadviewInstance.current) {
            roadviewInstance.current = new window.kakao.maps.Roadview(roadviewContainer.current);
            roadviewClient.current = new window.kakao.maps.RoadviewClient();
        }
    }, [isMapReady, roadviewContainer.current]); // roadviewContainer.current가 설정된 후 실행되도록 의존성 추가


    const displayMarkers = (places: AppRestaurant[]) => {
        // ... (이하 모든 함수 내용은 변경 없음)
        if (!mapInstance.current) return;
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        const newMarkers = places.map((place) => {
            const placePosition = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
            const marker = new window.kakao.maps.Marker({ position: placePosition });
            marker.setMap(mapInstance.current);
            return marker;
        });
        markers.current = newMarkers;
    };

    const setCenter = (lat: number, lng: number) => {
        if (!mapInstance.current) return;
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        mapInstance.current.setCenter(moveLatLon);
    };

    const drawDirections = async (origin: { lat: number, lng: number }, destination: { lat: number, lng: number }) => {
        if (!mapInstance.current) return;
        if (polylineInstance.current) polylineInstance.current.setMap(null);
        try {
            const response = await fetch(`/api/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`);
            const data = await response.json();
            if (data.path && data.path.length > 0) {
                const linePath = data.path.map((point: DirectionPoint) => new window.kakao.maps.LatLng(point.lat, point.lng));
                polylineInstance.current = new window.kakao.maps.Polyline({
                    path: linePath, strokeWeight: 6, strokeColor: "#007BFF", strokeOpacity: 0.8,
                });
                polylineInstance.current.setMap(mapInstance.current);
            }
        } catch (error) { console.error("Directions fetch failed:", error); }
    };

    const displayRoadview = (position: { lat: number, lng: number }) => {
        if (!roadviewClient.current || !roadviewInstance.current) {
            // 이 alert가 뜨면 로드뷰 객체가 생성되지 않은 것입니다.
            // alert("로드뷰 객체가 아직 준비되지 않았습니다.");
            return;
        }
        const placePosition = new window.kakao.maps.LatLng(position.lat, position.lng);
        roadviewClient.current.getNearestPanoId(placePosition, 50, (panoId) => {
            if (panoId) {
                roadviewInstance.current?.setPanoId(panoId, placePosition);
            } else {
                alert("해당 위치에 로드뷰 정보가 없습니다.");
            }
        });
    };
    
    const clearOverlays = () => {
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        if (polylineInstance.current) {
            polylineInstance.current.setMap(null);
        }
    };

    const relayout = () => {
        mapInstance.current?.relayout();
        roadviewInstance.current?.relayout();
    };

    return {
        isMapReady,
        isMapInitialized,
        mapContainerRef: mapContainer,
        mapInstance: mapInstance.current,
        roadviewContainerRef: roadviewContainer,
        roadviewInstance: roadviewInstance.current,
        displayMarkers,
        setCenter,
        drawDirections,
        clearOverlays,
        displayRoadview,
        relayout, // relayout 함수 반환
    };
}