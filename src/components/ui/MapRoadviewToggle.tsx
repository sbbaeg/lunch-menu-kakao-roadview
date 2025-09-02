'use client';

import { useEffect, useRef } from "react";

export interface MapRoadviewToggleProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>; // null 허용
  mapInstance: any;
  selectedPlace: { x: string; y: string } | null;
  isRoadviewMode: boolean;
  onToggleRoadview: (mode: boolean) => void;
}

const MapRoadviewToggle: React.FC<MapRoadviewToggleProps> = ({
  mapContainerRef,
  mapInstance,
  selectedPlace,
  isRoadviewMode,
  onToggleRoadview,
}) => {
  const roadviewClient = useRef<any>(null);
  const roadviewContainerRef = useRef<HTMLDivElement | null>(null);
  const rvPanoIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roadviewClient.current) {
      const { RoadviewClient } = (window as any).kakao.maps;
      roadviewClient.current = new RoadviewClient();
    }
  }, []);

  useEffect(() => {
    if (!mapInstance || !selectedPlace) return;

    if (isRoadviewMode) {
      const { kakao } = window as any;
      if (!roadviewContainerRef.current) return;

      const rv = new kakao.maps.Roadview(roadviewContainerRef.current, {
        panoId: 0,
        position: new kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x)),
      });

      roadviewClient.current.getNearestPanoId(
        new kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x)),
        50,
        (panoId: number) => {
          rv.setPanoId(panoId, () => {
            rvPanoIdRef.current = panoId;
          });
        }
      );

      mapContainerRef.current!.style.display = 'none';
      roadviewContainerRef.current.style.display = 'block';
    } else {
      if (roadviewContainerRef.current) {
        roadviewContainerRef.current.style.display = 'none';
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.style.display = 'block';
        // 선택된 장소 기준으로 지도 중심 재설정
        mapInstance.setCenter(new (window as any).kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x)));
      }
    }
  }, [isRoadviewMode, selectedPlace, mapInstance, mapContainerRef]);

  return (
    <div
      ref={roadviewContainerRef}
      style={{ width: "100%", height: "400px", display: "none" }}
    />
  );
};

export default MapRoadviewToggle;
