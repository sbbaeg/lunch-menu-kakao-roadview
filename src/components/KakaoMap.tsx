// src/components/KakaoMap.tsx

'use client';

import { useEffect, useRef } from 'react';
import type { KakaoMap, KakaoLatLng, KakaoPlaceItem, DirectionPoint, KakaoMarker, KakaoPolyline, KakaoRoadview, KakaoRoadviewClient } from '@/types';

interface KakaoMapProps {
  places: KakaoPlaceItem[];
  selectedPlace: KakaoPlaceItem | null;
  userLocation: KakaoLatLng | null;
  onMarkerClick: (place: KakaoPlaceItem) => void;
  roadviewContainerRef: React.RefObject<HTMLDivElement | null>;
  roadviewInstanceRef: React.MutableRefObject<KakaoRoadview | null>;
  roadviewClientRef: React.MutableRefObject<KakaoRoadviewClient | null>;
  isMapReady: boolean; // 부모의 isMapReady 상태를 전달받음
}

const KakaoMap = ({ places, selectedPlace, userLocation, onMarkerClick, roadviewContainerRef, roadviewInstanceRef, roadviewClientRef, isMapReady }: KakaoMapProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<KakaoMap | null>(null);
  const markers = useRef<KakaoMarker[]>([]);
  const polylineInstance = useRef<KakaoPolyline | null>(null);

  // 1. 지도 초기 생성: isMapReady가 true가 될 때만 실행
  useEffect(() => {
    if (isMapReady && window.kakao && window.kakao.maps && mapContainer.current && !mapInstance.current) {
      const mapOption = {
          center: new window.kakao.maps.LatLng(36.3504, 127.3845),
          level: 3,
      };
      mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption);

      if (roadviewContainerRef.current) {
          roadviewInstanceRef.current = new window.kakao.maps.Roadview(roadviewContainerRef.current);
          roadviewClientRef.current = new window.kakao.maps.RoadviewClient();
      }
    }
  }, [isMapReady, roadviewContainerRef, roadviewInstanceRef, roadviewClientRef]); // 의존성 배열 수정

  // 2. 장소 목록(places) 변경 시 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];
    const newMarkers = places.map(place => {
      const placePosition = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
      const marker = new window.kakao.maps.Marker({ position: placePosition });
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClick(place);
      });
      marker.setMap(mapInstance.current);
      return marker;
    });
    markers.current = newMarkers;

    if (places.length > 0 && !selectedPlace) {
      const firstPlacePosition = new window.kakao.maps.LatLng(Number(places[0].y), Number(places[0].x));
      mapInstance.current.setCenter(firstPlacePosition);
    } else if (userLocation && !selectedPlace) {
        mapInstance.current.setCenter(userLocation);
    }
  }, [places, userLocation, onMarkerClick, selectedPlace]);

  // 3. 선택된 장소(selectedPlace) 변경 시 경로 및 로드뷰 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;
    if (polylineInstance.current) polylineInstance.current.setMap(null);
    if (!selectedPlace || !userLocation) return;
    
    const placePosition = new window.kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x));
    mapInstance.current.setCenter(placePosition);

    fetch(`/api/directions?origin=${userLocation.getLng()},${userLocation.getLat()}&destination=${selectedPlace.x},${selectedPlace.y}`)
      .then(res => res.json())
      .then(data => {
        if (data.path && data.path.length > 0) {
          const linePath = data.path.map((point: DirectionPoint) => new window.kakao.maps.LatLng(point.lat, point.lng));
          polylineInstance.current = new window.kakao.maps.Polyline({
            path: linePath, strokeWeight: 6, strokeColor: '#007BFF', strokeOpacity: 0.8,
          });
          polylineInstance.current.setMap(mapInstance.current);
        }
      });
    
    if (roadviewClientRef.current && roadviewInstanceRef.current) {
        roadviewClientRef.current.getNearestPanoId(placePosition, 50, (panoId) => {
            if (panoId) {
                roadviewInstanceRef.current?.setPanoId(panoId, placePosition);
            }
        });
    }
  }, [selectedPlace, userLocation, roadviewClientRef, roadviewInstanceRef]);

  return <div ref={mapContainer} className="w-full h-full"></div>;
};

export default KakaoMap;