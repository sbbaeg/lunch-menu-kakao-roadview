'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
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
import MapRoadviewToggle from "@/components/ui/MapRoadviewToggle";

const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false });

// 타입 정의
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
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number; }) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: { position: KakaoLatLng; }) => KakaoMarker;
        Polyline: new (options: { path: KakaoLatLng[]; strokeColor: string; strokeWeight: number; strokeOpacity: number; }) => KakaoPolyline;
        Roadview: new (container: HTMLElement, options: { panoId?: string; position?: KakaoLatLng }) => any;
        RoadviewClient: new () => any;
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
}

interface KakaoSearchResponse {
  documents: KakaoPlaceItem[];
}

interface RouletteOption {
  option: string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
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

// 경로 좌표 타입
interface DirectionPoint {
  lat: number;
  lng: number;
}

const CATEGORIES = [
  "한식", "중식", "일식", "양식", "아시아음식", "분식",
  "패스트푸드", "치킨", "피자", "뷔페", "카페", "술집"
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
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400 text-lg">★</span>
      ))}
      {halfStar && <span className="text-yellow-400 text-lg">☆</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 text-lg">☆</span>
      ))}
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
  const [sortOrder, setSortOrder] = useState<'accuracy' | 'distance'>('accuracy');
  const [resultCount, setResultCount] = useState<number>(5);

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<KakaoMap | null>(null);
  const markers = useRef<KakaoMarker[]>([]);
  const polylineInstance = useRef<KakaoPolyline | null>(null);

  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isRoadviewMode, setIsRoadviewMode] = useState(false);

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
    script.onload = () => {
      window.kakao.maps.load(() => setIsMapReady(true));
    };
  }, []);

  useEffect(() => {
    if (isMapReady && mapContainer.current && !mapInstance.current) {
      const mapOption = {
        center: new window.kakao.maps.LatLng(36.3504, 127.3845),
        level: 3,
      };
      mapInstance.current = new window.kakao.maps.Map(mapContainer.current, mapOption);
    }
  }, [isMapReady]);

  // Google Details Fetch
  useEffect(() => {
    if (!recommendation) return;
    const fetchGoogleDetails = async () => {
      setIsDetailsLoading(true);
      setGoogleDetails(null);
      try {
        const response = await fetch(`/api/details?name=${encodeURIComponent(recommendation.place_name)}&lat=${recommendation.y}&lng=${recommendation.x}`);
        if (response.ok) setGoogleDetails(await response.json());
      } catch (error) {
        console.error("Failed to fetch Google details:", error);
      } finally {
        setIsDetailsLoading(false);
      }
    };
    fetchGoogleDetails();
  }, [recommendation]);

  useEffect(() => {
    if (!isDetailsLoading && mapInstance.current) {
      setTimeout(() => {
        mapInstance.current?.relayout();
      }, 100);
    }
  }, [googleDetails, isDetailsLoading]);

  useEffect(() => {
    if (sortOrder === 'accuracy') {
      setResultCount(5);
    }
  }, [sortOrder]);

  const getNearbyRestaurants = async (latitude: number, longitude: number): Promise<KakaoPlaceItem[]> => {
    const query = selectedCategories.length > 0 ? selectedCategories.join(',') : '음식점';
    const radius = selectedDistance;
    const sort = sortOrder;
    const size = resultCount;

    const response = await fetch(`/api/recommend?lat=${latitude}&lng=${longitude}&query=${encodeURIComponent(query)}&radius=${radius}&sort=${sort}&size=${size}`);
    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data.documents as KakaoPlaceItem[];
  };

  const handleRouletteSpin = () => {
    if (restaurantList.length === 0) return;
    setRouletteItems(restaurantList);
    const prize = Math.floor(Math.random() * restaurantList.length);
    setPrizeNumber(prize);
    setMustSpin(true);
    setIsRouletteOpen(true);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const handleDistanceChange = (value: string) => {
    setSelectedDistance(value);
  };

  const handleSortChange = (order: 'accuracy' | 'distance') => {
    setSortOrder(order);
  };

  const handleResultCountChange = (value: number) => {
    setResultCount(value);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-5xl">
        {/* 지도 & 로드뷰 토글 */}
        <div className="mb-4">
          <MapRoadviewToggle
            mapContainerRef={mapContainer}
            mapInstance={mapInstance.current}
            selectedPlace={recommendation}
            isRoadviewMode={isRoadviewMode}
            onToggleRoadview={(mode: boolean) => setIsRoadviewMode(mode)}
          />
        </div>

        {/* 필터 UI */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>카테고리 선택</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Label key={cat} className="flex items-center gap-1">
                <Checkbox
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={(checked) => handleCategoryChange(cat, !!checked)}
                />
                {cat}
              </Label>
            ))}
          </CardContent>
          <CardFooter>
            <div className="flex gap-4">
              <Label>거리: </Label>
              <RadioGroup
                value={selectedDistance}
                onValueChange={handleDistanceChange}
                className="flex gap-2"
              >
                {DISTANCES.map(d => (
                  <Label key={d.value} className="flex items-center gap-1">
                    <RadioGroupItem value={d.value} />
                    {d.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </CardFooter>
        </Card>

        {/* 음식점 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurantList.map(place => (
            <Card key={place.id}>
              <CardHeader>
                <CardTitle>{place.place_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{place.road_address_name}</p>
                <p>{place.category_name}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setRecommendation(place)}>선택</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Google Details */}
        {recommendation && googleDetails && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Google Details</CardTitle>
            </CardHeader>
            <CardContent>
              {googleDetails.photos && googleDetails.photos.length > 0 && (
                <Carousel>
                  <CarouselContent>
                    {googleDetails.photos.map((photo, index) => (
                      <CarouselItem key={index}>
                        <Image src={photo} alt="사진" width={300} height={200} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious>◀</CarouselPrevious>
                  <CarouselNext>▶</CarouselNext>
                </Carousel>
              )}
              <p>전화번호: {googleDetails.phone || '정보 없음'}</p>
              <p>평점: {googleDetails.rating ? <StarRating rating={googleDetails.rating} /> : '정보 없음'}</p>
              <p>영업시간: {getTodaysOpeningHours(googleDetails.opening_hours) || '정보 없음'}</p>
              <a href={googleDetails.url} target="_blank" rel="noreferrer">Google 페이지 보기</a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
