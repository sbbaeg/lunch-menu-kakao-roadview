// src/types/kakao.d.ts
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  relayout(): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoPolyline {
  setMap(map: KakaoMap | null): void;
}

interface KakaoRoadview {
  setViewpoint(viewpoint: { pan: number; tilt: number; zoom: number }): void;
  setPanoId(panoId: number, panoClient?: any): void;
  setMap(roadview: KakaoRoadview | null): void;
}

interface KakaoMaps {
  load(callback: () => void): void;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { position: KakaoLatLng }) => KakaoMarker;
  Polyline: new (options: { path: KakaoLatLng[]; strokeColor: string; strokeWeight: number; strokeOpacity: number }) => KakaoPolyline;
  Roadview: new (container: HTMLElement, options: { panoId?: number; position?: { lat: number; lng: number } }) => KakaoRoadview;
}

declare global {
  interface Window {
    kakao: {
      maps: KakaoMaps;
    };
  }
}
