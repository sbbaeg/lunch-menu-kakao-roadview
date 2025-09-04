'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { HelpCircle } from 'lucide-react';

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false });

// --- 타입 정의 ---
type KakaoMap = {
  setCenter: (latlng: KakaoLatLng) => void;
  relayout: () => void;
};
type KakaoRoadview = {
  setPanoId: (panoId: number, position: KakaoLatLng) => void;
  relayout: () => void;
};
type KakaoRoadviewClient = {
  getNearestPanoId: (position: KakaoLatLng, radius: number, callback: (panoId: number | null) => void) => void;
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

interface KakaoPlaceItem {
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
interface KakaoSearchResponse { documents: KakaoPlaceItem[]; }
interface RouletteOption { option: string; style?: { backgroundColor?: string; textColor?: string; }; }
interface GoogleOpeningHours { open_now: boolean; weekday_text?: string[]; }
interface GoogleDetails { url?: string; photos: string[]; rating?: number; opening_hours?: GoogleOpeningHours; phone?: string; }
interface DirectionPoint { lat: number; lng: number; }
// --- 타입 정의 끝 ---

const CATEGORIES = [ "한식", "중식", "일식", "양식", "아시아음식", "분식", "패스트푸드", "치킨", "피자", "뷔페", "카페", "술집" ];
const DISTANCES = [ { value: '500', label: '가까워요', walkTime: '약 5분' }, { value: '800', label: '적당해요', walkTime: '약 10분' }, { value: '2000', label: '조금 멀어요', walkTime: '약 25분' } ];

// NOTE: 디버깅을 위해 일부 컴포넌트와 함수를 잠시 비활성화하거나 단순화했습니다.
const StarRating = ({ rating }: { rating: number }) => <div>별점: {rating}</div>
const getTodaysOpeningHours = (openingHours?: GoogleOpeningHours): string | null => "영업시간 정보"

export default function Home() {
  alert("1. Home 컴포넌트 실행 시작");

  const [recommendation, setRecommendation] = useState<KakaoPlaceItem | null>(null);
  const [restaurantList, setRestaurantList] = useState<KakaoPlaceItem[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<KakaoMap | null>(null);
  const roadviewContainer = useRef<HTMLDivElement | null>(null);
  const roadviewInstance = useRef<KakaoRoadview | null>(null);
  const roadviewClient = useRef<KakaoRoadviewClient | null>(null);

  alert("2. State 및 Ref 초기화 완료");

  useEffect(() => {
    alert("3. 스크립트 로드 useEffect 진입");
    const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_JS_KEY;
    if (!KAKAO_JS_KEY) {
      alert("오류: KAKAO_JS_KEY를 찾을 수 없습니다!");
      return;
    }
    const scriptId = 'kakao-maps-script';
    if (document.getElementById(scriptId)) {
      if (window.kakao && window.kakao.maps) {
        alert("3A. 스크립트 이미 로드됨");
        setIsMapReady(true);
      }
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services,event`;
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      window.kakao.maps.load(() => {
        alert("3B. 카카오맵 스크립트 로드 및 초기화 성공!");
        setIsMapReady(true);
      });
    };
    script.onerror = () => {
      alert("오류: 카카오맵 스크립트를 로드하는 데 실패했습니다.");
    };
  }, []);
  
  useEffect(() => {
    alert("4. 지도 생성 useEffect 진입 (isMapReady: " + isMapReady + ")");
    if (isMapReady && mapContainer.current && !mapInstance.current) {
      setTimeout(() => {
        alert("4A. 지도 생성 setTimeout 실행");
        if (mapContainer.current) {
          const mapOption = { center: new window.kakao.maps.LatLng(36.3504, 127.3845), level: 3 };
          mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption);
          if (roadviewContainer.current) {
            roadviewInstance.current = new window.kakao.maps.Roadview(roadviewContainer.current);
            roadviewClient.current = new window.kakao.maps.RoadviewClient();
          }
          alert("4B. 지도 인스턴스 생성 완료!");
        }
      }, 100);
    }
  }, [isMapReady]);
  
  alert("5. JSX 렌더링 직전");

  return (
    <main className="flex flex-col items-center w-full min-h-screen p-4 md:p-8 bg-gray-50">
      {/* --- [수정] 즉시 실행 함수(IIFE) 형태로 변경 --- */}
      {(() => {
        alert("6. JSX 렌더링 시작");
        return null;
      })()}
      <Card className="w-full max-w-6xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full h-80 md:h-auto md:min-h-[600px] md:flex-grow rounded-lg overflow-hidden border shadow-sm">
            <div ref={mapContainer} className={`w-full h-full`}></div>
            <div ref={roadviewContainer} className={`w-full h-full absolute top-0 left-0`}></div>
          </div>
          <div className="w-full md:w-1/3 flex flex-col items-center md:justify-start space-y-4">
            <div className="w-full max-w-sm flex gap-2">
              <Button disabled={loading || !isMapReady}>음식점 검색</Button>
              <Button disabled={loading || !isMapReady}>음식점 룰렛</Button>
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild><Button variant="outline">필터</Button></DialogTrigger>
                <DialogContent>
                  {/* --- [수정] 즉시 실행 함수(IIFE) 형태로 변경 --- */}
                  {(() => {
                    alert("7. 필터 다이얼로그 렌더링");
                    return null;
                  })()}
                  <DialogHeader><DialogTitle>검색 필터 설정</DialogTitle></DialogHeader>
                  <div className="py-4 space-y-4">
                    <Label>테스트 필터</Label>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="w-full max-w-sm space-y-4">
              <Card className="w-full flex items-center justify-center h-40 text-gray-500 border-dashed border-2">
                <p>음식점을 검색해보세요!</p>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}