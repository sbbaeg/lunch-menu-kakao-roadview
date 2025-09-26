"use client";

import { Restaurant, KakaoPlaceItem, GoogleDetails, Review, GoogleOpeningHours } from '@/lib/types'; 

import { useSession, signIn, signOut } from "next-auth/react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import dynamic from "next/dynamic";
import Image from "next/image";
import { HelpCircle, ChevronDown, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";


// page.tsx 파일 상단, import 구문 바로 아래

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace kakao.maps {
    class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
    }

    class Map {
        constructor(container: HTMLElement, options: { center: LatLng; level: number });
        setCenter(latlng: LatLng): void;
        relayout(): void;
        getCenter(): LatLng;
    }

    class Marker {
        constructor(options: { position: LatLng });
        setMap(map: Map | null): void;
    }

    class Polyline {
        constructor(options: {
            path: LatLng[];
            strokeColor: string;
            strokeWeight: number;
            strokeOpacity: number;
        });
        setMap(map: Map | null): void;
    }
    
    class Roadview {
        constructor(container: HTMLElement);
        setPanoId(panoId: number, position: LatLng): void;
        relayout(): void;
    }

    class RoadviewClient {
        constructor();
        getNearestPanoId(
            position: LatLng,
            radius: number,
            callback: (panoId: number | null) => void
        ): void;
    }
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace event {
        function addListener(target: kakao.maps.Map | kakao.maps.Marker, type: string, handler: () => void): void;
        function removeListener(target: kakao.maps.Map | kakao.maps.Marker, type: string, handler: () => void): void;
    }
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace services {
        interface PlacesSearchResultItem {
            y: string;
            x: string;
            place_name: string;
            road_address_name: string;
        }

        type PlacesSearchResult = PlacesSearchResultItem[];

        interface Pagination {
            totalCount: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
            current: number;
            nextPage(): void;
            prevPage(): void;
            gotoPage(page: number): void;
        }

        class Places {
            constructor();
            keywordSearch(
                keyword: string,
                callback: (
                    data: PlacesSearchResult,
                    status: Status,
                    pagination: Pagination
                ) => void
            ): void;
        }

        enum Status {
            OK = 'OK',
            ZERO_RESULT = 'ZERO_RESULT',
            ERROR = 'ERROR',
        }
    }
}

declare global {
    interface Window {
        kakao: {
            maps: {
                load: (callback: () => void) => void;
                services: typeof kakao.maps.services;
                event: typeof kakao.maps.event;
            } & typeof kakao.maps;
        };
    }
}

// page.tsx 컴포넌트 내부에서만 사용하는 타입들
interface KakaoSearchResponse {
    documents: KakaoPlaceItem[];
}
interface RouletteOption {
    option: string;
    style?: { backgroundColor?: string; textColor?: string };
}
interface DirectionPoint {
    lat: number;
    lng: number;
}


const Wheel = dynamic(
    () => import("react-custom-roulette").then((mod) => mod.Wheel),
    { ssr: false }
);

// --- 타입 정의 끝 ---

const CATEGORIES = [
    "한식",
    "중식",
    "일식",
    "양식",
    "아시아음식",
    "분식",
    "패스트푸드",
    "치킨",
    "피자",
    "뷔페",
    "카페",
    "술집",
];
const DISTANCES = [
    { value: "500", label: "가까워요", walkTime: "약 5분" },
    { value: "800", label: "적당해요", walkTime: "약 10분" },
    { value: "2000", label: "조금 멀어요", walkTime: "약 25분" },
];


const StarRating = ({ rating, reviewCount, isTrigger = false }: { rating: number, reviewCount?: number, isTrigger?: boolean }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className={`flex items-center ${isTrigger ? 'cursor-pointer' : ''}`}>
            {[...Array(fullStars)].map((_, i) => (
                <span key={`full-${i}`} className="text-yellow-400 text-lg">★</span>
            ))}
            {halfStar && <span className="text-yellow-400 text-lg">☆</span>}
            {[...Array(emptyStars)].map((_, i) => (
                <span key={`empty-${i}`} className="text-gray-300 text-lg">☆</span>
            ))}
            <span className="ml-2 text-sm font-bold">{rating.toFixed(1)}</span>

            {isTrigger && reviewCount !== undefined && (
                <div className="ml-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>리뷰 ({reviewCount}개)</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                </div>
            )}
        </div>
    );
};

const getTodaysOpeningHours = (
    openingHours?: GoogleOpeningHours
): string | null => {
    if (!openingHours?.weekday_text) return null;
    const today = new Date().getDay();
    const googleApiIndex = (today + 6) % 7;
    const todaysHours = openingHours.weekday_text[googleApiIndex];
    return todaysHours
        ? todaysHours.substring(todaysHours.indexOf(":") + 2)
        : "정보 없음";
};

export default function Home() {
    const { data: session, status } = useSession();
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
        undefined
    );
    const [restaurantList, setRestaurantList] = useState<Restaurant[]>([]);
    const [rouletteItems, setRouletteItems] = useState<Restaurant[]>([]);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [userLocation, setUserLocation] = useState<kakao.maps.LatLng | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDistance, setSelectedDistance] = useState<string>("800");
    const [sortOrder, setSortOrder] = useState<
        "accuracy" | "distance" | "rating"
    >("accuracy");
    const [resultCount, setResultCount] = useState<number>(5);
    const [minRating, setMinRating] = useState<number>(4.0);
    const [favorites, setFavorites] = useState<Restaurant[]>([]);

    const [displayedSortOrder, setDisplayedSortOrder] = useState<
        "accuracy" | "distance" | "rating"
    >("accuracy");

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempSelectedCategories, setTempSelectedCategories] = useState<
        string[]
    >([]);
    const [tempSelectedDistance, setTempSelectedDistance] =
        useState<string>("800");
    const [tempSortOrder, setTempSortOrder] = useState<
        "accuracy" | "distance" | "rating"
    >("accuracy");
    const [tempResultCount, setTempResultCount] = useState<number>(5);
    const [tempMinRating, setTempMinRating] = useState<number>(4.0);
    const [searchInFavoritesOnly, setSearchInFavoritesOnly] = useState(false);
    const [tempSearchInFavoritesOnly, setTempSearchInFavoritesOnly] = useState(false);

    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);

    useEffect(() => {
        console.log("CCTV 2: 'favorites' 상태 변경됨", favorites);
    }, [favorites]);

    const [searchAddress, setSearchAddress] = useState("");
    const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<kakao.maps.Map | null>(null); // 변경
    const polylineInstance = useRef<kakao.maps.Polyline | null>(null); // 변경
    const [loading, setLoading] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isRoadviewVisible, setRoadviewVisible] = useState(false);
    const roadviewContainer = useRef<HTMLDivElement | null>(null);
    const roadviewInstance = useRef<kakao.maps.Roadview | null>(null); // 변경
    const roadviewClient = useRef<kakao.maps.RoadviewClient | null>(null); // 변경
    const markers = useRef<kakao.maps.Marker[]>([]); // 변경
    const openFilterDialog = () => {
        setTempSelectedCategories(selectedCategories);
        setTempSelectedDistance(selectedDistance);
        setTempSortOrder(sortOrder);
        setTempResultCount(resultCount);
        setTempMinRating(minRating);
        setTempSearchInFavoritesOnly(searchInFavoritesOnly);
        setIsFilterOpen(true);
    };

    // 즐겨찾기 목록이 변경될 때마다 로컬 저장소에 저장     
    useEffect(() => {
        const loadFavorites = async () => {
            // 로그인 상태일 때: 서버 API를 호출하여 DB에서 가져오기
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/favorites');
                    if (response.ok) {
                        const dbFavorites = await response.json();

                        console.log("CCTV 1: 서버 응답 (raw)", dbFavorites);

                        setFavorites(dbFavorites);
                    }
                } catch (error) {
                    console.error('즐겨찾기 로딩 중 오류:', error);
                }
            } 
            // 게스트 상태일 때: localStorage에서 가져오기
            else if (status === 'unauthenticated') {
                const localFavorites = localStorage.getItem('favoriteRestaurants');
                if (localFavorites) {
                    setFavorites(JSON.parse(localFavorites));
                } else {
                    setFavorites([]);
                }
            }
        };

        loadFavorites();
    }, [status]);

    useEffect(() => {
        if (selectedItemId && userLocation) {
            const selectedPlace = restaurantList.find(
                (place) => place.id === selectedItemId
            );
            if (selectedPlace) {
                updateViews(selectedPlace, userLocation);
            }
        }
    }, [selectedItemId, restaurantList, userLocation]);

    useEffect(() => {
        const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_JS_KEY;
        if (!KAKAO_JS_KEY) return;
        const scriptId = "kakao-maps-script";
        if (document.getElementById(scriptId)) {
            if (window.kakao && window.kakao.maps) setIsMapReady(true);
            return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
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
            mapInstance.current = new window.kakao.maps.Map(
                mapContainer.current,
                mapOption
            );
            if (roadviewContainer.current) {
                roadviewInstance.current = new window.kakao.maps.Roadview(
                    roadviewContainer.current
                );
                roadviewClient.current = new window.kakao.maps.RoadviewClient();
            }
        }
    }, [isMapReady]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (isRoadviewVisible) {
                roadviewInstance.current?.relayout();
            }
            mapInstance.current?.relayout();
        }, 10);
        return () => clearTimeout(timerId);
    }, [isRoadviewVisible]);

    useEffect(() => {
        if (mapInstance.current) {
            setTimeout(() => {
                mapInstance.current?.relayout();
            }, 100);
        }
    }, [selectedItemId]);

    useEffect(() => {
        if (sortOrder === "accuracy") setResultCount(5);
        }, [sortOrder]);

        useEffect(() => {
        if (!isMapReady || !mapInstance.current) return;

        const showButton = () => {
            // GPS 기반 첫 검색 시에는 버튼이 나타나지 않도록 함
            if (userLocation) {
                setShowSearchAreaButton(true);
            }
        };

        // 'idle' 이벤트는 지도의 드래그, 줌 등 모든 움직임이 끝났을 때 발생
        window.kakao.maps.event.addListener(mapInstance.current, 'idle', showButton);

        // 컴포넌트가 언마운트될 때 이벤트 리스너를 제거
        return () => {
            if (mapInstance.current) {
                window.kakao.maps.event.removeListener(mapInstance.current, 'idle', showButton);
            }
        };
    }, [isMapReady, userLocation]); // userLocation이 설정된 후에 리스너가 동작하도록 의존성 추가

    useEffect(() => {
        // 카카오톡 인앱 브라우저인지 확인
        if (/KAKAOTALK/i.test(navigator.userAgent)) {
        // 현재 URL을 외부 브라우저로 열기 위한 카카오톡 링크로 변환
        const kakaoOpenUrl = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
        
        // 사용자에게 안내 후 외부 브라우저로 전환
        if (confirm("원활한 로그인을 위해 외부 브라우저로 이동합니다.")) {
            window.location.href = kakaoOpenUrl;
        }
        }
    }, []); 

    const getNearbyRestaurants = async (
        latitude: number,
        longitude: number
    ): Promise<Restaurant[]> => { // ✅ 반환 타입을 Restaurant[]으로 변경
        const query =
            selectedCategories.length > 0
                ? selectedCategories.join(",")
                : "음식점";
        const radius = selectedDistance;
        const sort = sortOrder;
        const size = resultCount;

        const response = await fetch(
            `/api/recommend?lat=${latitude}&lng=${longitude}&query=${encodeURIComponent(
                query
            )}&radius=${radius}&sort=${sort}&size=${size}&minRating=${minRating}`
        );
        if (!response.ok) throw new Error("API call failed");
        
        // ✅ snake_case로 받은 데이터를 camelCase로 번역하는 로직 추가
        const data: KakaoSearchResponse = await response.json();
        const formattedRestaurants: Restaurant[] = (data.documents || []).map(place => ({
            id: place.id,
            placeName: place.place_name,
            categoryName: place.category_name,
            address: place.road_address_name,
            x: place.x,
            y: place.y,
            placeUrl: place.place_url,
            distance: place.distance,
            googleDetails: place.googleDetails,
        }));
        
        return formattedRestaurants;
    };
    const handleTempCategoryChange = (category: string) => {
        setTempSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleTempSelectAll = (checked: boolean | "indeterminate") => {
        setTempSelectedCategories(checked === true ? CATEGORIES : []);
    };

    const displayMarkers = (places: Restaurant[]) => {
        if (!mapInstance.current) return;
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        const newMarkers = places.map((place) => {
            const placePosition = new window.kakao.maps.LatLng(
                Number(place.y),
                Number(place.x)
            );
            const marker = new window.kakao.maps.Marker({
                position: placePosition,
            });
            marker.setMap(mapInstance.current);
            return marker;
        });
        markers.current = newMarkers;
    };

    const recommendProcess = (isRoulette: boolean) => {
        setLoading(true);
        setDisplayedSortOrder(sortOrder);
        clearMapAndResults();
        if (searchInFavoritesOnly) {
            if (favorites.length === 0) {
                alert("즐겨찾기에 등록된 음식점이 없습니다.");
                setLoading(false);
                return;
            }

            // 즐겨찾기 목록을 결과로 사용 (API 호출 없음)
            const results = favorites.filter(place => {
            // 1. 카테고리 필터
            const categoryMatch = selectedCategories.length === 0 || 
                                  selectedCategories.some(cat => place.categoryName.includes(cat));

            // 2. 최소 별점 필터
            const ratingMatch = (place.googleDetails?.rating || 0) >= minRating;

            return categoryMatch && ratingMatch;
        });

        if (results.length === 0) {
            alert("즐겨찾기 중에서 현재 필터 조건에 맞는 음식점이 없습니다.");
            setLoading(false);
            return;
        }

            if (isRoulette) {
                if (results.length < 2) {
                    alert(`룰렛을 돌리기에 즐겨찾기 수가 부족합니다. (2개 이상 필요)`);
                    setLoading(false);
                    return;
                }
                setRouletteItems(results);
                setIsRouletteOpen(true);
            } else {
                setRestaurantList(results);
                displayMarkers(results);
            }
            setLoading(false);

        } else {
            // '즐겨찾기만 검색' 옵션이 꺼져 있을 때의 기존 로직 (수정 전 코드와 동일)
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const currentLocation = new window.kakao.maps.LatLng(
                        latitude,
                        longitude
                    );
                    setUserLocation(currentLocation);
                    if (mapInstance.current)
                        mapInstance.current.setCenter(currentLocation);
                    try {
                        const restaurants = await getNearbyRestaurants(
                            latitude,
                            longitude
                        );
                        if (restaurants.length === 0) {
                            alert("주변에 조건에 맞는 음식점을 찾지 못했어요!");
                            setLoading(false);
                            return;
                        }
                        if (isRoulette) {
                            const rouletteCandidates = restaurants.slice(
                                0,
                                resultCount
                            );
                            if (rouletteCandidates.length < 2) {
                                alert(
                                    `주변에 추첨할 음식점이 ${resultCount}개 미만입니다.`
                                );
                                setLoading(false);
                                return;
                            }
                            setRouletteItems(rouletteCandidates);
                            setIsRouletteOpen(true);
                            setMustSpin(false);
                        } else {
                            const finalRestaurants =
                                sortOrder === "distance" || sortOrder === "rating"
                                    ? restaurants
                                    : [...restaurants]
                                        .sort(() => 0.5 - Math.random())
                                        .slice(0, resultCount);
                            setRestaurantList(finalRestaurants);
                            if (finalRestaurants.length > 0) {
                                displayMarkers(finalRestaurants);
                            }
                        }
                    } catch (error) {
                        console.error("Error:", error);
                        alert("음식점을 불러오는 데 실패했습니다.");
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("위치 정보를 가져오는 데 실패했습니다.");
                    setLoading(false);
                }
            );
        }
    };

    const handleSpinClick = () => {
        if (mustSpin) return;
        const newPrizeNumber = Math.floor(Math.random() * rouletteItems.length);
        setPrizeNumber(newPrizeNumber);
        setMustSpin(true);
    };

    const clearMapAndResults = () => {
        setSelectedItemId(undefined);
        setRestaurantList([]);
        setRoadviewVisible(false);
        markers.current.forEach((marker) => {
            marker.setMap(null);
        });
        markers.current = [];
        if (polylineInstance.current) polylineInstance.current.setMap(null);
    };

    const updateViews = async (
        place: Restaurant,
        currentLoc: kakao.maps.LatLng
    ) => {
        const placePosition = new window.kakao.maps.LatLng(
            Number(place.y),
            Number(place.x)
        );
        if (mapInstance.current) {
            mapInstance.current.setCenter(placePosition);
            if (polylineInstance.current) polylineInstance.current.setMap(null);
            try {
                const response = await fetch(
                    `/api/directions?origin=${currentLoc.getLng()},${currentLoc.getLat()}&destination=${
                        place.x
                    },${place.y}`
                );
                const data = await response.json();
                if (data.path && data.path.length > 0) {
                    const linePath = data.path.map(
                        (point: DirectionPoint) =>
                            new window.kakao.maps.LatLng(point.lat, point.lng)
                    );
                    polylineInstance.current = new window.kakao.maps.Polyline({
                        path: linePath,
                        strokeWeight: 6,
                        strokeColor: "#007BFF",
                        strokeOpacity: 0.8,
                    });
                    polylineInstance.current.setMap(mapInstance.current);
                }
            } catch (error) {
                console.error("Directions fetch failed:", error);
            }
        }
        if (roadviewClient.current && roadviewInstance.current) {
            roadviewClient.current.getNearestPanoId(
                placePosition,
                50,
                (panoId) => {
                    if (panoId) {
                        roadviewInstance.current?.setPanoId(
                            panoId,
                            placePosition
                        );
                    } else {
                        console.log("해당 위치에 로드뷰 정보가 없습니다.");
                    }
                }
            );
        }
    };

    const rouletteData: RouletteOption[] = rouletteItems.map((item, index) => {
        const colors = [
            "#FF6B6B",
            "#FFD966",
            "#96F291",
            "#66D9E8",
            "#63A4FF",
            "#f9a8d4",
            "#d9a8f9",
            "#f3a683",
            "#a29bfe",
            "#e17055",
            "#00b894",
            "#74b9ff",
            "#ff7675",
            "#fdcb6e",
            "#55efc4",
        ];
        return {
            option: item.placeName,
            style: {
                backgroundColor: colors[index % colors.length],
                textColor: "#333333",
            },
        };
    });

    const getSortTitle = (sort: "accuracy" | "distance" | "rating"): string => {
        switch (sort) {
            case "distance":
                return "가까운 순 결과";
            case "rating":
                return "별점 순 결과";
            case "accuracy":
            default:
                return "랜덤 추천 결과";
        }
    };

    const handleApplyFilters = () => {
        setSelectedCategories(tempSelectedCategories);
        setSelectedDistance(tempSelectedDistance);
        setSortOrder(tempSortOrder);
        setResultCount(tempResultCount);
        setMinRating(tempMinRating);
        setSearchInFavoritesOnly(tempSearchInFavoritesOnly);
        setIsFilterOpen(false);
    };

    const isFavorite = (placeId: string) => favorites.some((fav) => fav.id === placeId);

    const toggleFavorite = async (place: Restaurant) => {
        // 먼저 화면을 즉시 업데이트
        const isCurrentlyFavorite = isFavorite(place.id);
        const newFavorites = isCurrentlyFavorite
            ? favorites.filter((fav) => fav.id !== place.id)
            : [...favorites, place];
        setFavorites(newFavorites);

        // 로그인 상태이면 API를 호출하여 DB에 저장
        if (status === 'authenticated') {
            try {
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(place),
                });
                if (!response.ok) {
                    setFavorites(favorites); // 실패 시 화면 원상 복구
                    alert('즐겨찾기 처리에 실패했습니다.');
                }
            } catch (error) {
                setFavorites(favorites); // 실패 시 화면 원상 복구
                alert('즐겨찾기 처리에 실패했습니다.');
            }
        } 
        // 게스트 상태이면 localStorage에 저장
        else {
            localStorage.setItem('favoriteRestaurants', JSON.stringify(newFavorites));
        }
    };
    
    const handleAddressSearch = () => {
        if (!searchAddress.trim()) {
            alert("검색어를 입력해주세요.");
            return;
        }

        if (!window.kakao || !window.kakao.maps.services) {
            alert("지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const ps = new window.kakao.maps.services.Places();
        
        ps.keywordSearch(searchAddress, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const firstResult = data[0];
                const moveLatLon = new window.kakao.maps.LatLng(Number(firstResult.y), Number(firstResult.x));
                
                mapInstance.current?.setCenter(moveLatLon);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                alert("검색 결과가 존재하지 않습니다.");
            } else {
                alert("검색 중 오류가 발생했습니다.");
            }
        });
    };

    const handleSearchInArea = async () => {
    if (!mapInstance.current) return;

    setShowSearchAreaButton(false); // 버튼을 누르면 다시 숨김
    setLoading(true);
    clearMapAndResults();

    const center = mapInstance.current.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    try {
        const restaurants = await getNearbyRestaurants(lat, lng);
        if (restaurants.length === 0) {
            alert("주변에 조건에 맞는 음식점을 찾지 못했어요!");
        } else {
            // 'accuracy'(랜덤) 정렬일 경우 결과를 섞어줌
            const finalRestaurants =
                sortOrder === "distance" || sortOrder === "rating"
                    ? restaurants
                    : [...restaurants]
                            .sort(() => 0.5 - Math.random())
                            .slice(0, resultCount);
            setRestaurantList(finalRestaurants);
            displayMarkers(finalRestaurants);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("음식점을 불러오는 데 실패했습니다.");
    } finally {
        setLoading(false);
    }
};

    return (
        <main className="w-full min-h-screen">
            <Card className="w-full min-h-screen rounded-none border-none flex flex-col items-center p-4 md:p-8">
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    {status === 'loading' && <div className="w-24 h-10 bg-muted rounded-md animate-pulse" />}
                    {status === 'unauthenticated' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>로그인</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>로그인</DialogTitle>
                                    <p className="text-sm text-muted-foreground pt-1">
                                        이전에 사용한 계정으로 빠르게 로그인하세요.
                                    </p>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {/* 1. 빠른 자동 로그인을 위한 버튼 */}
                                    <Button 
                                        onClick={() => signIn('google')}
                                        className="w-full"
                                    >
                                        Google로 빠른 로그인
                                    </Button>
                                    <Button 
                                        onClick={() => signIn('kakao')}
                                        className="w-full"
                                    >
                                        Kakao로 빠른 로그인
                                    </Button>
                                </div>
                                <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                    또는
                                    </span>
                                </div>
                                </div>
                                <div className="grid gap-4">
                                    {/* 2. 다른 계정 선택을 위한 버튼 */}
                                    <Button 
                                        variant="secondary"
                                        onClick={() => signIn('google', undefined, { prompt: 'select_account' })}
                                        className="w-full"
                                    >
                                        다른 Google 계정 사용
                                    </Button>
                                    <Button 
                                        variant="secondary"
                                        onClick={() => signIn('kakao', undefined, { prompt: 'select_account' })}
                                        className="w-full"
                                    >
                                        다른 Kakao 계정 사용
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    
                    {status === 'authenticated' && (
                        <>
                            <span className="text-sm font-medium">{session.user?.name}님</span>
                            <Button variant="outline" onClick={() => signOut()}>로그아웃</Button>
                        </>
                    )}
                    <ThemeToggle />
                </div>
                <Card className="w-full max-w-6xl p-6 md:p-8">
<div className="flex flex-col md:flex-row gap-6">
    {/* 왼쪽 지도 패널 */}
    <div className="w-full h-[720px] md:flex-grow rounded-lg border shadow-sm flex flex-col overflow-hidden">
        
        {/* 주소 검색 영역 */}
        <div className="p-4 border-b bg-muted/40">
            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="주소나 장소 이름으로 검색"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="bg-background text-base h-11"
                />
                <Button
                    size="lg"
                    className="h-11"
                    onClick={handleAddressSearch}
                >
                    이동
                </Button>
            </div>
        </div>

        {/* 지도와 '재검색' 버튼을 감싸는 컨테이너 */}
        <div className="relative flex-1">
            {/* '이 지역에서 재검색' 버튼 */}
            {showSearchAreaButton && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-md">
                    <Button
                        size="lg"
                        onClick={handleSearchInArea}
                        className="bg-white text-black rounded-full hover:bg-gray-200 shadow-lg"
                    >
                        이 지역에서 재검색
                    </Button>
                </div>
            )}

            {/* 실제 지도가 렌더링되는 곳 */}
            <div
                ref={mapContainer}
                className={`w-full h-full transition-opacity duration-300 ${
                    isRoadviewVisible
                        ? "opacity-0 invisible"
                        : "opacity-100 visible"
                }`}
            ></div>
            
            {/* 로드뷰, API 정보 버튼 등 나머지 오버레이 UI */}
            <div
                ref={roadviewContainer}
                className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${
                    isRoadviewVisible
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                }`}
            ></div>
            {selectedItemId && (
                <Button
                    onClick={() =>
                        setRoadviewVisible((prev) => !prev)
                    }
                    variant="secondary"
                    className="absolute top-3 right-3 z-10 shadow-lg"
                >
                    {isRoadviewVisible
                        ? "지도 보기"
                        : "로드뷰 보기"}
                </Button>
            )}
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-4 right-4 h-8 w-8 rounded-full z-20"
                    >
                        <HelpCircle className="h-5 w-5 text-gray-500" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>API 정보</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-sm space-y-2">
                        <p>
                            <strong className="font-semibold">
                                📍 위치 검색:
                            </strong>
                            <span className="ml-2">
                                Kakao Maps API
                            </span>
                        </p>
                        <p>
                            <strong className="font-semibold">
                                ⭐ 별점 및 상세 정보:
                            </strong>
                            <span className="ml-2">
                                Google Maps API
                            </span>
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>

    {/* 오른쪽 제어 패널 */}
    <div className="w-full md:w-1/3 flex flex-col items-center md:justify-start space-y-4">
        <div className="w-full max-w-sm flex gap-2 justify-center">
            <Button
                onClick={() => recommendProcess(false)}
                disabled={loading || !isMapReady}
                size="lg"
                className="px-6"
            >
                검색
            </Button>
            <Button
                onClick={() => recommendProcess(true)}
                disabled={loading || !isMapReady}
                size="lg"
                className="px-6"
            >
                룰렛
            </Button>
            <Dialog
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
            >
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={openFilterDialog}
                    >
                        필터
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-sm:max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            검색 필터 설정
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 dark:text-foreground overflow-y-auto pr-4 flex-1">
                        <div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="temp-favorites-only"
                                    checked={tempSearchInFavoritesOnly}
                                    onCheckedChange={(checked) => setTempSearchInFavoritesOnly(Boolean(checked))}
                                />
                                <Label
                                    htmlFor="temp-favorites-only"
                                    className="font-semibold text-lg cursor-pointer"
                                >
                                    즐겨찾기에서만 검색
                                </Label>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div>
                            <Label className="text-lg font-semibold">
                                음식 종류
                            </Label>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {CATEGORIES.map(
                                    (category) => (
                                        <div
                                            key={category}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`temp-${category}`}
                                                checked={tempSelectedCategories.includes(
                                                    category
                                                )}
                                                onCheckedChange={() =>
                                                    handleTempCategoryChange(
                                                        category
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`temp-${category}`}
                                            >
                                                {category}
                                            </Label>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                                <Checkbox
                                    id="temp-select-all"
                                    checked={
                                        tempSelectedCategories.length ===
                                        CATEGORIES.length
                                    }
                                    onCheckedChange={(
                                        checked
                                    ) =>
                                        handleTempSelectAll(
                                            checked
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="temp-select-all"
                                    className="font-semibold"
                                >
                                    모두 선택
                                </Label>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div>
                            <Label className="text-lg font-semibold">
                                검색 반경
                            </Label>
                            <RadioGroup
                                value={tempSelectedDistance}
                                onValueChange={
                                    setTempSelectedDistance
                                }
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2"
                            >
                                {DISTANCES.map((dist) => (
                                    <div
                                        key={dist.value}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={
                                                dist.value
                                            }
                                            id={`temp-${dist.value}`}
                                        />
                                        <Label
                                            htmlFor={`temp-${dist.value}`}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold">
                                                    {
                                                        dist.label
                                                    }
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{`(${dist.value}m ${dist.walkTime})`}</span>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div>
                            <Label className="text-lg font-semibold">
                                정렬 방식
                            </Label>
                            <RadioGroup
                                value={tempSortOrder}
                                onValueChange={(value) =>
                                    setTempSortOrder(
                                        value as
                                            | "accuracy"
                                            | "distance"
                                            | "rating"
                                    )
                                }
                                className="flex flex-wrap gap-4 pt-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="accuracy"
                                        id="temp-sort-accuracy"
                                    />
                                    <Label htmlFor="temp-sort-accuracy">
                                        랜덤 추천
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="distance"
                                        id="temp-sort-distance"
                                    />
                                    <Label htmlFor="temp-sort-distance">
                                        가까운 순
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="rating"
                                        id="temp-sort-rating"
                                    />
                                    <Label htmlFor="temp-sort-rating">
                                        별점 순
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div>
                            <Label
                                htmlFor="temp-min-rating"
                                className="text-lg font-semibold"
                            >
                                최소 별점:{" "}
                                {tempMinRating.toFixed(1)}점
                                이상
                            </Label>
                            <Slider
                                id="temp-min-rating"
                                value={[tempMinRating]}
                                onValueChange={(value) =>
                                    setTempMinRating(
                                        value[0]
                                    )
                                }
                                min={0}
                                max={5}
                                step={0.1}
                                className="mt-2"
                            />
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div>
                            <Label
                                htmlFor="temp-result-count"
                                className="text-lg font-semibold"
                            >
                                검색 개수: {tempResultCount}
                                개
                            </Label>
                            <Slider
                                id="temp-result-count"
                                value={[tempResultCount]}
                                onValueChange={(value) =>
                                    setTempResultCount(
                                        value[0]
                                    )
                                }
                                min={5}
                                max={15}
                                step={1}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleApplyFilters}
                        >
                            완료
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
                    <Button
                        variant="outline"
                        size="lg"
                        className="px-4"
                        onClick={() => setIsFavoritesListOpen(true)}
                    >
                        즐겨찾기
                    </Button>
            </div>

        <div className="w-full max-w-sm space-y-2">
            {restaurantList.length > 0 ? (
                <div className="space-y-2 max-h-[720px] overflow-y-auto pr-2">
                    <p className="text-sm font-semibold text-gray-600 pl-1">
                        {getSortTitle(displayedSortOrder)}:{" "}
                        {restaurantList.length}개
                    </p>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        value={selectedItemId}
                        onValueChange={setSelectedItemId}
                    >
                        {restaurantList.map((place) => {
                            const details =
                                place.googleDetails;
                            return (
                                <AccordionItem value={place.id} key={place.id} className="border-b group">
                                    <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
                                        <AccordionTrigger className="text-left hover:no-underline p-0 [&_svg]:hidden">
                                            <div className="w-full">
                                                <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                                                    <CardTitle className="text-md">
                                                        {
                                                            place.placeName
                                                        }
                                                    </CardTitle>
                                                    <span className="text-xs text-gray-600 whitespace-nowrap dark:text-gray-400">
                                                        {
                                                            place.distance
                                                        }
                                                        m
                                                    </span>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-3 pt-0 text-xs flex justify-between items-center text-gray-600 dark:text-gray-400">
                                                    <span>
                                                        {place.categoryName
                                                            .split(
                                                                ">"
                                                            )
                                                            .pop()
                                                            ?.trim()}
                                                    </span>
                                                    {details?.rating && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-yellow-400">
                                                                ★
                                                            </span>
                                                            <span>
                                                                {details.rating.toFixed(
                                                                    1
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div
                                                className="px-4 pb-4 text-sm space-y-3 border-t"
                                                onClick={(
                                                    e
                                                ) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex items-center justify-between pt-2">
                                                    <p className="text-xs text-gray-500">
                                                        {
                                                            place.categoryName
                                                        }
                                                    </p>
                                                   <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => toggleFavorite(place)}
                                                    >
                                                        <Heart className={isFavorite(place.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                                                    </Button>
                                                </div>

                                                {!details && (
                                                    <p className="text-gray-500">
                                                        Google에서
                                                        추가
                                                        정보를
                                                        찾지
                                                        못했습니다.
                                                    </p>
                                                )}

                                                {details?.rating && (
                                                    <Accordion type="single" collapsible className="w-full">
                                                        <AccordionItem value="reviews" className="border-none">
                                                            <AccordionTrigger className="hover:no-underline py-1">
                                                                <StarRating
                                                                    rating={details.rating}
                                                                    reviewCount={
                                                                        details.reviews?.length || 0
                                                                    }
                                                                    isTrigger={true}
                                                                />
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="max-h-[300px] overflow-y-auto pr-2">
                                                                    {details?.reviews &&
                                                                    details.reviews.length > 0 ? (
                                                                        details.reviews.map(
                                                                            (review, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="border-b py-4"
                                                                                >
                                                                                    <div className="flex items-center mb-2">
                                                                                        <Image
                                                                                            src={
                                                                                                review.profile_photo_url
                                                                                            }
                                                                                            alt={
                                                                                                review.author_name
                                                                                            }
                                                                                            width={40}
                                                                                            height={40}
                                                                                            className="rounded-full mr-3"
                                                                                        />
                                                                                        <div>
                                                                                            <p className="font-semibold">
                                                                                                {
                                                                                                    review.author_name
                                                                                                }
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500">
                                                                                                {
                                                                                                    review.relative_time_description
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <StarRating
                                                                                            rating={
                                                                                                review.rating
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <p className="mt-2 text-sm">
                                                                                        {review.text}
                                                                                    </p>
                                                                                </div>
                                                                            )
                                                                        )
                                                                    ) : (
                                                                        <p className="py-4 text-center text-gray-500">
                                                                            표시할 리뷰가 없습니다.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}

                                                {details?.opening_hours && (
                                                    <div className="flex flex-col">
                                                        <p>
                                                            <strong>
                                                                영업:
                                                            </strong>{" "}
                                                            <span
                                                                className={
                                                                    details
                                                                        .opening_hours
                                                                        .open_now
                                                                        ? "text-green-600 font-bold"
                                                                        : "text-red-600 font-bold"
                                                                }
                                                            >
                                                                {details
                                                                    .opening_hours
                                                                    .open_now
                                                                    ? "영업 중"
                                                                    : "영업 종료"}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 ml-1">
                                                            (오늘:{" "}
                                                            {getTodaysOpeningHours(
                                                                details.opening_hours
                                                            )}

                                                            )
                                                        </p>
                                                    </div>
                                                )}

                                                {details?.phone && (
                                                    <p>
                                                        <strong>
                                                            전화:
                                                        </strong>{" "}
                                                        <a
                                                            href={`tel:${details.phone}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {
                                                                details.phone
                                                            }
                                                        </a>
                                                    </p>
                                                )}

                                                {details?.photos &&
                                                    details
                                                        .photos
                                                        .length >
                                                        0 && (
                                                        <div>
                                                            <strong>
                                                                사진:
                                                            </strong>
                                                            <Carousel className="w-full max-w-xs mx-auto mt-2">
                                                                <CarouselContent>
                                                                    {details.photos.map(
                                                                        (
                                                                            photoUrl,
                                                                            index
                                                                        ) => (
                                                                            <CarouselItem
                                                                                key={
                                                                                    index
                                                                                }
                                                                            >
                                                                                <Dialog>
                                                                                    <DialogTrigger
                                                                                        asChild
                                                                                    >
                                                                                        <button className="w-full focus:outline-none">
                                                                                            <Image
                                                                                                src={
                                                                                                    photoUrl
                                                                                                }
                                                                                                alt={`${
                                                                                                    place.placeName
                                                                                                } photo ${
                                                                                                    index +
                                                                                                    1
                                                                                                }`}
                                                                                                width={
                                                                                                    400
                                                                                                }
                                                                                                height={
                                                                                                    225
                                                                                                }
                                                                                                className="object-cover aspect-video rounded-md"
                                                                                            />
                                                                                        </button>
                                                                                    </DialogTrigger>
                                                                                    <DialogContent className="max-w-3xl h-[80vh] p-2">
                                                                                        <Image
                                                                                            src={
                                                                                                photoUrl
                                                                                            }
                                                                                            alt={`${
                                                                                                place.placeName
                                                                                            } photo ${
                                                                                                index +
                                                                                                1
                                                                                            }`}
                                                                                            fill
                                                                                            style={{
                                                                                                objectFit:
                                                                                                    "contain",
                                                                                            }}
                                                                                        />
                                                                                    </DialogContent>
                                                                                </Dialog>
                                                                            </CarouselItem>
                                                                        )
                                                                    )}
                                                                </CarouselContent>
                                                                <CarouselPrevious className="left-2" />
                                                                <CarouselNext className="right-2" />
                                                            </Carousel>
                                                        </div>
                                                    )}

                                                <div className="flex gap-2 pt-2">
                                                    <a
                                                        href={
                                                            place.placeUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1"
                                                    >
                                                        <Button
                                                            size="sm"
                                                            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold flex items-center justify-center"
                                                        >
                                                            <Image
                                                                src="/kakaomap_icon.png"
                                                                alt="카카오맵 로고"
                                                                width={
                                                                    16
                                                                }
                                                                height={
                                                                    16
                                                                }
                                                                className="mr-2"
                                                            />
                                                            카카오맵
                                                        </Button>
                                                    </a>
                                                    {details?.url && (
                                                        <a
                                                            href={
                                                                details.url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1"
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full font-bold flex items-center justify-center"
                                                            >
                                                                <Image
                                                                    src="/googlemap_icon.png"
                                                                    alt="구글맵 로고"
                                                                    width={
                                                                        16
                                                                    }
                                                                    height={
                                                                        16
                                                                    }
                                                                    className="mr-2"
                                                                />
                                                                구글맵
                                                            </Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            ) : (
                <Card className="w-full flex items-center justify-center h-40 text-gray-500 border shadow-sm">
                    <p>음식점을 검색해보세요!</p>
                </Card>
            )}
        </div>
    </div>
</div>
                </Card>

                <Dialog open={isFavoritesListOpen} onOpenChange={setIsFavoritesListOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl">즐겨찾기 목록</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-y-auto pr-4 mt-4">
                            {favorites.length > 0 ? (
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                    value={selectedItemId}
                                    onValueChange={setSelectedItemId}
                                >
                                    {favorites.map((place) => {
                                        const details = place.googleDetails;
                                        return (
                                            <AccordionItem value={place.id} key={place.id} className="border-b group">
                                                <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
                                                    <AccordionTrigger className="text-left hover:no-underline p-0 [&_svg]:hidden">
                                                        <div className="w-full">
                                                            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                                                                <CardTitle className="text-md">
                                                                    {place.placeName}
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="px-4 pb-3 pt-0 text-xs flex justify-between items-center text-gray-600 dark:text-gray-400">
                                                                <span>
                                                                    {place.categoryName
                                                                        .split(">")
                                                                        .pop()
                                                                        ?.trim()}
                                                                </span>
                                                                {details?.rating && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-yellow-400">★</span>
                                                                        <span>{details.rating.toFixed(1)}</span>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </div>
                                                    </AccordionTrigger>
                                                    {/* ▼▼▼▼▼▼▼▼▼▼ 바로 이 AccordionContent 내부를 채워넣어야 합니다 ▼▼▼▼▼▼▼▼▼▼ */}
                                                    <AccordionContent>
                                                        <div
                                                            className="px-4 pb-4 text-sm space-y-3 border-t"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-between pt-2">
                                                                <p className="text-xs text-gray-500">
                                                                    {place.categoryName}
                                                                </p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => toggleFavorite(place)}
                                                                >
                                                                    <Heart className={isFavorite(place.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                                                                </Button>
                                                            </div>

                                                            {!details && (
                                                                <p className="text-gray-500">
                                                                    Google에서 추가 정보를 찾지 못했습니다.
                                                                </p>
                                                            )}

                                                            {details?.rating && (
                                                                <Accordion type="single" collapsible className="w-full">
                                                                    <AccordionItem value="reviews" className="border-none">
                                                                        <AccordionTrigger className="hover:no-underline py-1">
                                                                            <StarRating
                                                                                rating={details.rating}
                                                                                reviewCount={details.reviews?.length || 0}
                                                                                isTrigger={true}
                                                                            />
                                                                        </AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="max-h-[300px] overflow-y-auto pr-2">
                                                                                {details?.reviews && details.reviews.length > 0 ? (
                                                                                    details.reviews.map((review, index) => (
                                                                                        <div key={index} className="border-b py-4">
                                                                                            <div className="flex items-center mb-2">
                                                                                                <Image
                                                                                                    src={review.profile_photo_url}
                                                                                                    alt={review.author_name}
                                                                                                    width={40}
                                                                                                    height={40}
                                                                                                    className="rounded-full mr-3"
                                                                                                />
                                                                                                <div>
                                                                                                    <p className="font-semibold">{review.author_name}</p>
                                                                                                    <p className="text-xs text-gray-500">{review.relative_time_description}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div><StarRating rating={review.rating} /></div>
                                                                                            <p className="mt-2 text-sm">{review.text}</p>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <p className="py-4 text-center text-gray-500">표시할 리뷰가 없습니다.</p>
                                                                                )}
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
                                                            )}

                                                            {details?.opening_hours && (
                                                                <div className="flex flex-col">
                                                                    <p>
                                                                        <strong>영업:</strong>{" "}
                                                                        <span className={details.opening_hours.open_now ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                                                            {details.opening_hours.open_now ? "영업 중" : "영업 종료"}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 ml-1">(오늘: {getTodaysOpeningHours(details.opening_hours)})</p>
                                                                </div>
                                                            )}

                                                            {details?.phone && (
                                                                <p><strong>전화:</strong> <a href={`tel:${details.phone}`} className="text-blue-600 hover:underline">{details.phone}</a></p>
                                                            )}

                                                            {details?.photos && details.photos.length > 0 && (
                                                                <div>
                                                                    <strong>사진:</strong>
                                                                    <Carousel className="w-full max-w-xs mx-auto mt-2">
                                                                        <CarouselContent>
                                                                            {details.photos.map((photoUrl, index) => (
                                                                                <CarouselItem key={index}>
                                                                                    <Dialog>
                                                                                        <DialogTrigger asChild>
                                                                                            <button className="w-full focus:outline-none">
                                                                                                <Image src={photoUrl} alt={`${place.placeName} photo ${index + 1}`} width={400} height={225} className="object-cover aspect-video rounded-md" />
                                                                                            </button>
                                                                                        </DialogTrigger>
                                                                                        <DialogContent className="max-w-3xl h-[80vh] p-2">
                                                                                            <Image src={photoUrl} alt={`${place.placeName} photo ${index + 1}`} fill style={{ objectFit: "contain" }} />
                                                                                        </DialogContent>
                                                                                    </Dialog>
                                                                                </CarouselItem>
                                                                            ))}
                                                                        </CarouselContent>
                                                                        <CarouselPrevious className="left-2" />
                                                                        <CarouselNext className="right-2" />
                                                                    </Carousel>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 pt-2">
                                                                <a href={place.placeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                                    <Button size="sm" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold flex items-center justify-center">
                                                                        <Image src="/kakaomap_icon.png" alt="카카오맵 로고" width={16} height={16} className="mr-2" />
                                                                        카카오맵
                                                                    </Button>
                                                                </a>
                                                                {details?.url && (
                                                                    <a href={details.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                                        <Button variant="outline" size="sm" className="w-full font-bold flex items-center justify-center">
                                                                            <Image src="/googlemap_icon.png" alt="구글맵 로고" width={16} height={16} className="mr-2" />
                                                                            구글맵
                                                                        </Button>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                    {/* ▲▲▲▲▲▲▲▲▲▲ 이 AccordionContent 내부를 채워넣어야 합니다 ▲▲▲▲▲▲▲▲▲▲ */}
                                                </Card>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>즐겨찾기에 등록된 음식점이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isRouletteOpen} onOpenChange={setIsRouletteOpen}>
                    <DialogContent className="max-w-md p-6">
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl mb-4">
                                룰렛을 돌려 오늘 점심을 선택하세요!
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col justify-center items-center space-y-6">
                            {rouletteData.length > 0 && (
                                <Wheel
                                    mustStartSpinning={mustSpin}
                                    prizeNumber={prizeNumber}
                                    data={rouletteData}
                                    onStopSpinning={() => {
                                        setMustSpin(false);
                                        setTimeout(() => {
                                            setIsRouletteOpen(false);
                                            if (userLocation) {
                                                const winner =
                                                    rouletteItems[prizeNumber];
                                                setRestaurantList([winner]);
                                                displayMarkers([winner]);
                                                setSelectedItemId(winner.id);
                                                updateViews(
                                                    winner,
                                                    userLocation
                                                );
                                            }
                                        }, 2000);
                                    }}
                                />
                            )}
                            <Button
                                onClick={handleSpinClick}
                                disabled={mustSpin}
                                className="w-full max-w-[150px]"
                            >
                                돌리기
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>
        </main>
    );
}