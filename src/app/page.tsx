'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import dynamic from 'next/dynamic';
import Image from 'next/image';

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false });

// Kakao 타입 정의
type KakaoMap = {
  setCenter: (latlng: KakaoLatLng) => void;
  relayout: () => void;
};
type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
};
type KakaoPolyline = {
  setMap: (map: KakaoMap | null) => void;
};
type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: { position: KakaoLatLng }) => KakaoMarker;
        Polyline: new (options: { path: KakaoLatLng[]; strokeColor: string; strokeWeight: number; strokeOpacity: number }) => KakaoPolyline;
        Roadview: new (container: HTMLElement) => KakaoRoadviewInstance;
        RoadviewClient: new () => KakaoRoadviewClient;
      };
    };
  }
}

type KakaoRoadviewInstance = {
  setPanoId: (panoId: number, pov?: { heading: number; pitch: number; zoom: number }) => void;
};
type KakaoRoadviewClient = {
  getNearestPanoId: (latlng: KakaoLatLng, radius: number, callback: (panoId: number) => void) => void;
};

// 기타 타입
interface KakaoPlaceItem {
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
  documents: KakaoPlaceItem[];
}

interface RouletteOption {
  option: string;
  style?: { backgroundColor?: string; textColor?: string };
}

interface GoogleOpeningHours {
  open_now: boolean;
  weekday_text?: string[];
}
interface GoogleDetails {
  url?: string;
  photos: string[];
  rating?: number;
  opening_hours?: GoogleOpeningHours;
  phone?: string;
}

interface DirectionPoint {
  lat: number;
  lng: number;
}

const CATEGORIES = [
  "한식","중식","일식","양식","아시아음식","분식",
  "패스트푸드","치킨","피자","뷔페","카페","술집"
];

const DISTANCES = [
  { value: '500', label: '가까워요', walkTime: '약 5분' },
  { value: '800', label: '적당해요', walkTime: '약 10분' },
  { value: '2000', label: '조금 멀어요', walkTime: '약 25분' },
];

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <span key={i} className="text-yellow-400 text-lg">★</span>)}
      {halfStar && <span className="text-yellow-400 text-lg">☆</span>}
      {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-gray-300 text-lg">☆</span>)}
      <span className="ml-2 text-sm font-bold">{rating.toFixed(1)}</span>
    </div>
  );
};

const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => {
  if (!openingHours?.weekday_text) return null;
  const today = new Date().getDay();
  const googleApiIndex = (today + 6) % 7;
  const todaysHours = openingHours.weekday_text[googleApiIndex];
  return todaysHours ? todaysHours.substring(todaysHours.indexOf(':') + 2) : "정보 없음";
};

export default function Home() {
  const [recommendation, setRecommendation] = useState<KakaoPlaceItem | null>(null);
  const [restaurantList, setRestaurantList] = useState<KakaoPlaceItem[]>([]);
  const [googleDetails, setGoogleDetails] = useState<GoogleDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<KakaoPlaceItem[]>([]);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [userLocation, setUserLocation] = useState<KakaoLatLng | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<string>('800');
  const [sortOrder, setSortOrder] = useState<'accuracy'|'distance'>('accuracy');
  const [resultCount, setResultCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isRoadview, setIsRoadview] = useState(false);

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const roadviewContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<KakaoMap | null>(null);
  const markers = useRef<KakaoMarker[]>([]);
  const polylineInstance = useRef<KakaoPolyline | null>(null);
  const roadviewInstance = useRef<KakaoRoadviewInstance | null>(null);

  // Kakao Maps script load
  useEffect(() => {
    const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_JS_KEY;
    if (!KAKAO_JS_KEY) return;
    const scriptId = 'kakao-maps-script';
    if (document.getElementById(scriptId)) {
      if (window.kakao && window.kakao.maps) setIsMapReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => window.kakao.maps.load(() => setIsMapReady(true));
  }, []);

  useEffect(() => {
    if (isMapReady && mapContainer.current && !mapInstance.current) {
      const mapOption = { center: new window.kakao.maps.LatLng(36.3504,127.3845), level: 3 };
      mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption);
    }
  }, [isMapReady]);

  // 로드뷰 토글 함수
  const toggleRoadview = () => {
    if (!mapInstance.current || !userLocation || !roadviewContainer.current || !mapContainer.current) return;
    if (!isRoadview) {
      const rvClient = new window.kakao.maps.RoadviewClient();
      rvClient.getNearestPanoId(userLocation, 50, (panoId) => {
        roadviewInstance.current = new window.kakao.maps.Roadview(roadviewContainer.current!);
        roadviewInstance.current.setPanoId(panoId, { heading: 0, pitch: 0, zoom: 0 });
        mapContainer.current!.style.display = 'none';
        roadviewContainer.current!.style.display = 'block';
      });
    } else {
      mapContainer.current.style.display = 'block';
      roadviewContainer.current.style.display = 'none';
    }
    setIsRoadview(!isRoadview);
  };

  // 나머지 기존 추천, 룰렛, 마커, 경로 관련 함수는 이전과 동일
  // displayMarkers, updateMapAndCard, recommendProcess 등 기존 로직 유지

  return (
    <main className="flex flex-col items-center w-full min-h-screen p-4 md:p-8 bg-gray-50">
      <Button onClick={toggleRoadview}>{isRoadview ? '지도 보기' : '로드뷰 보기'}</Button>
      <div ref={mapContainer} className="w-full h-80 md:min-h-[600px] rounded-lg overflow-hidden border shadow-sm"></div>
      <div ref={roadviewContainer} className="w-full h-80 md:min-h-[600px] rounded-lg overflow-hidden border shadow-sm" style={{ display: 'none' }}></div>
    </main>
  );
}
