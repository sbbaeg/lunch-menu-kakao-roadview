"use client";

import { Restaurant, KakaoPlaceItem, GoogleOpeningHours, RestaurantWithTags } from '@/lib/types';

import { Tag } from '@/lib/types';

import { useSession, signIn, signOut } from "next-auth/react";

import { Switch } from "@/components/ui/switch";

import Link from 'next/link';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { HelpCircle, ChevronDown, Heart, EyeOff, Menu, Tags } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";


import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { Badge } from "@/components/ui/badge";


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

    const [openNowOnly, setOpenNowOnly] = useState(false);
    const [includeUnknownHours, setIncludeUnknownHours] = useState(true); // 정보 없는 가게 포함 여부 (기본값 true)
    const [tempOpenNowOnly, setTempOpenNowOnly] = useState(false);
    const [tempIncludeUnknownHours, setTempIncludeUnknownHours] = useState(true);

    const [selectedTags, setSelectedTags] = useState<number[]>([]); // 실제 적용될 태그 ID 목록
    const [tempSelectedTags, setTempSelectedTags] = useState<number[]>([]); // 필터창에서 임시로 선택할 목록


    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);

    const [blacklist, setBlacklist] = useState<Restaurant[]>([]); // 관리 목록을 담을 상태
    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false); // 관리 팝업을 여닫을 상태
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false); // 태그 관리 팝업 상태
    const [blacklistExcludedCount, setBlacklistExcludedCount] = useState<number>(0);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

    const [taggingRestaurant, setTaggingRestaurant] = useState<Restaurant | null>(null); // 현재 태그를 편집할 음식점 정보
    const [userTags, setUserTags] = useState<Tag[]>([]);
    const [subscribedTags, setSubscribedTags] = useState<{ id: number; name: string; creatorName: string | null; }[]>([]);
    const [subscribedTagIds, setSubscribedTagIds] = useState<number[]>([]);
    const [newTagName, setNewTagName] = useState("");

    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isCreatingTag, setIsCreatingTag] = useState(false);

    useEffect(() => {
        console.log("CCTV 2: 'favorites' 상태 변경됨", favorites);
    }, [favorites]);

    // ✅ 로그인 상태가 변경될 때 블랙리스트를 불러오는 useEffect를 추가합니다.
    useEffect(() => {
        const loadBlacklist = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/blacklist');
                    if (response.ok) {
                        const data = await response.json();
                        setBlacklist(data);
                    }
                } catch (error) {
                    console.error('블랙리스트 로딩 중 오류:', error);
                }
            } else {
                // 로그아웃 시 블랙리스트 비우기
                setBlacklist([]);
            }
        };

        loadBlacklist();
    }, [status]);

    useEffect(() => {
        const loadUserTags = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/tags');
                    if (response.ok) {
                        const data = await response.json();
                        setUserTags(data);
                    }
                } catch (error) {
                    console.error('사용자 태그 로딩 중 오류:', error);
                }
            } else {
                // 로그아웃 시에는 태그 목록을 비웁니다.
                setUserTags([]);
            }
        };

        loadUserTags();
    }, [status]); // 로그인 상태가 바뀔 때마다 실행됩니다.

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
        setTempOpenNowOnly(openNowOnly);
        setTempIncludeUnknownHours(includeUnknownHours);
        setTempSelectedTags(selectedTags);
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

    useEffect(() => {
        const fetchSubscribedTags = async () => {
            // 로그인 상태일 때만 API를 호출합니다.
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/subscriptions');
                    if (response.ok) {
                        const data = await response.json();
                        setSubscribedTags(data);
                    }
                } catch (error) {
                    console.error("구독 태그 로딩 실패:", error);
                }
            }
        };

        // 팝업(isTagManagementOpen)이 열렸을 때만 함수를 실행합니다.
        if (isTagManagementOpen) {
            fetchSubscribedTags();
        }
    }, [isTagManagementOpen, status]); // 팝업 상태나 로그인 상태가 변경될 때마다 실행됩니다.

    useEffect(() => {
        const fetchSubscribedTagIds = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/subscriptions');
                    if (response.ok) {
                        const data: { id: number }[] = await response.json();
                        setSubscribedTagIds(data.map(tag => tag.id)); // ID만 추출하여 상태에 저장
                    }
                } catch (error) {
                    console.error("구독 태그 ID 로딩 실패:", error);
                }
            } else {
                setSubscribedTagIds([]); // 로그아웃 시 목록 비우기
            }
        };
        fetchSubscribedTagIds();
    }, [status]); // 로그인 상태가 변경될 때마다 실행

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

        let apiUrl = `/api/recommend?lat=${latitude}&lng=${longitude}&query=${encodeURIComponent(
            query
        )}&radius=${radius}&sort=${sort}&size=${size}&minRating=${minRating}&openNow=${openNowOnly}&includeUnknown=${includeUnknownHours}`;

        // ✅ 선택된 태그가 있을 경우에만, tags 파라미터를 URL에 추가합니다.
        if (selectedTags.length > 0) {
            apiUrl += `&tags=${selectedTags.join(',')}`;
        }

        const response = await fetch(apiUrl);
        const data: { documents?: RestaurantWithTags[], blacklistExcludedCount?: number, tagExcludedCount?: number } = await response.json();

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
            tags: place.tags,
        }));

        setBlacklistExcludedCount(data.blacklistExcludedCount || 0);
                
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
    setBlacklistExcludedCount(0); // 상태 초기화
    clearMapAndResults();

    // ✅ results 변수를 함수 최상단에 선언합니다.
    let results: Restaurant[] = [];

    if (searchInFavoritesOnly) {
        if (favorites.length === 0) {
            setAlertInfo({ title: "알림", message: "즐겨찾기에 등록된 음식점이 없습니다." });
            setLoading(false);
            return;
        }

        // ✅ let/const 키워드를 삭제하고, 이미 선언된 results에 값을 할당합니다.
        results = favorites.filter(place => {
            const categoryMatch = selectedCategories.length === 0 || 
                                  selectedCategories.some(cat => place.categoryName.includes(cat));
            const ratingMatch = (place.googleDetails?.rating || 0) >= minRating;
            return categoryMatch && ratingMatch;
        });

        if (results.length === 0) {
            setAlertInfo({ title: "알림", message: "즐겨찾기 중에서 현재 필터 조건에 맞는 음식점이 없습니다." });
            setLoading(false);
            return;
        }

        // ✅ 정렬 및 개수 제한 로직을 이 안으로 이동시킵니다.
        let sortedResults: Restaurant[] = [];
        if (sortOrder === 'rating') {
            sortedResults = [...results].sort((a, b) => (b.googleDetails?.rating || 0) - (a.googleDetails?.rating || 0));
        } else {
            sortedResults = [...results].sort(() => 0.5 - Math.random());
        }
        
        // isRoulette이 아닐 경우에만 개수 제한을 적용합니다.
        if (!isRoulette) {
            results = sortedResults.slice(0, resultCount);
        } else {
            results = sortedResults;
        }

    }

    if (isRoulette) {
        if (searchInFavoritesOnly && results.length < 2) {
             setAlertInfo({ title: "알림", message: "룰렛을 돌리기에 즐겨찾기 수가 부족합니다. (2개 이상 필요)" });
             setLoading(false);
             return;
        }
        
        // 일반 검색의 경우, results가 비어있으므로 restaurantList에서 가져옵니다.
        const rouletteCandidates = searchInFavoritesOnly ? results : restaurantList.slice(0, resultCount);

        if (rouletteCandidates.length < 2) {
            setAlertInfo({ title: "알림", message: `주변에 추첨할 음식점이 ${resultCount}개 미만입니다.` });
            setLoading(false);
            return;
        }
        setRouletteItems(rouletteCandidates);
        setIsRouletteOpen(true);
        setLoading(false); // 로딩 종료
    } else if (searchInFavoritesOnly) {
        // '즐겨찾기에서만 검색'이고 룰렛이 아닌 경우
        setRestaurantList(results);
        displayMarkers(results);
        setLoading(false); // 로딩 종료
    } else {
        // '일반 검색'이고 룰렛이 아닌 경우 (기존 로직)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const currentLocation = new window.kakao.maps.LatLng(latitude, longitude);
                setUserLocation(currentLocation);
                if (mapInstance.current) mapInstance.current.setCenter(currentLocation);
                
                try {
                    const restaurants = await getNearbyRestaurants(latitude, longitude);
                    if (restaurants.length === 0) {
                        setAlertInfo({ title: "알림", message: "주변에 조건에 맞는 음식점을 찾지 못했어요!" });
                    } else {
                        const finalRestaurants = (sortOrder === 'distance' || sortOrder === 'rating')
                            ? restaurants
                            : [...restaurants].sort(() => 0.5 - Math.random()).slice(0, resultCount);
                        setRestaurantList(finalRestaurants);
                        displayMarkers(finalRestaurants);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    setAlertInfo({ title: "오류", message: "음식점을 불러오는 데 실패했습니다." });
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setAlertInfo({ title: "오류", message: "위치 정보를 가져오는 데 실패했습니다." });
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

    const handleTempTagChange = (tagId: number) => {
        setTempSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleApplyFilters = () => {
        setSelectedCategories(tempSelectedCategories);
        setSelectedDistance(tempSelectedDistance);
        setSortOrder(tempSortOrder);
        setResultCount(tempResultCount);
        setMinRating(tempMinRating);
        setSearchInFavoritesOnly(tempSearchInFavoritesOnly);
        setOpenNowOnly(tempOpenNowOnly);
        setIncludeUnknownHours(tempIncludeUnknownHours);
        setSelectedTags(tempSelectedTags);
        setIsFilterOpen(false);
    };

    const handleBlacklistClick = () => {
        if (status === 'authenticated') {
            // 로그인 상태이면 -> 블랙리스트 팝업 열기
            setIsBlacklistOpen(true);
        } else {
            // 비로그인 상태이면 -> 로그인 안내창 띄우기
            setAlertInfo({ title: "오류", message: "로그인이 필요한 기능입니다." });
            // (추가 개선) alert 대신, 로그인 Dialog를 열어주는 것이 더 좋은 사용자 경험을 제공합니다.
        }
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
                    setAlertInfo({ title: "오류", message: "즐겨찾기 처리에 실패했습니다." });
                }
            } catch (error) {
                setFavorites(favorites); // 실패 시 화면 원상 복구
                setAlertInfo({ title: "오류", message: "즐겨찾기 처리에 실패했습니다." });
            }
        } 
        // 게스트 상태이면 localStorage에 저장
        else {
            localStorage.setItem('favoriteRestaurants', JSON.stringify(newFavorites));
        }
    };

    const isBlacklisted = (placeId: string) => blacklist.some((item) => item.id === placeId);

    const toggleBlacklist = async (place: Restaurant) => {
        if (status !== 'authenticated') {
            setAlertInfo({ title: "오류", message: "로그인이 필요한 기능입니다." });
            return;
        }

        // 낙관적 업데이트: API 응답을 기다리지 않고 UI를 먼저 변경
        const isCurrentlyBlacklisted = isBlacklisted(place.id);
        const newBlacklist = isCurrentlyBlacklisted
            ? blacklist.filter((item) => item.id !== place.id)
            : [...blacklist, place];
        setBlacklist(newBlacklist);

        // API 호출
        try {
            const response = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(place),
            });

            if (!response.ok) {
                // 실패 시 UI를 원래대로 복구
                setBlacklist(blacklist); 
                setAlertInfo({ title: "오류", message: "블랙리스트 처리에 실패했습니다." });
            }
        } catch (error) {
            // 실패 시 UI를 원래대로 복구
            setBlacklist(blacklist);
            setAlertInfo({ title: "오류", message: "블랙리스트 처리에 실패했습니다." });
        }
    };

    const handleCreateTagFromManager = async () => {
        if (!newTagName.trim() || isCreatingTag) return;
        setIsCreatingTag(true);
        try {
            const createResponse = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName }),
            });

            if (createResponse.ok) {
                const newTag = await createResponse.json();
                setUserTags(prevTags => [...prevTags, newTag]);
                setNewTagName("");
            } else {
                setAlertInfo({ title: "오류", message: "태그 생성에 실패했거나 이미 존재하는 태그입니다." });
            }
        } catch (error) {
            console.error("태그 생성 오류:", error);
            setAlertInfo({ title: "오류", message: "태그 생성 중 오류가 발생했습니다." });
        } finally {
            setIsCreatingTag(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim() || !taggingRestaurant || isCreatingTag) return;
    
        setIsCreatingTag(true);
        try {
            // 1. 태그 생성 API 호출
            const createResponse = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName }),
            });
    
            if (!createResponse.ok) {
                // 생성 실패 또는 중복 태그 처리
                setAlertInfo({ title: "오류", message: "태그 생성에 실패했거나 이미 존재하는 태그입니다." });
                setIsCreatingTag(false); // 로딩 상태 해제
                return;
            }
    
            const newTag = await createResponse.json();
            
            // UI에 새로 생성된 태그 즉시 반영
            setUserTags(prevTags => [...prevTags, newTag]);
            setNewTagName(""); // 입력 필드 초기화
    
            // 2. 생성된 태그와 음식점 연결 API 호출
            const linkResponse = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tagId: newTag.id, 
                    restaurant: taggingRestaurant 
                }),
            });
    
            if (linkResponse.ok) {
                // 연결 성공 시, 레스토랑 목록의 태그 정보 업데이트
                const updatedRestaurant = {
                    ...taggingRestaurant,
                    tags: [...(taggingRestaurant.tags || []), newTag],
                };
                handleTagsChange(updatedRestaurant); // restaurantList, favorites 상태 업데이트
                setTaggingRestaurant(updatedRestaurant); // 현재 열려있는 다이얼로그의 정보도 업데이트
            } else {
                // 연결 실패 처리
                setAlertInfo({ title: "오류", message: "태그 연결에 실패했습니다." });
            }
        } catch (error) {
            console.error("태그 생성 및 연결 오류:", error);
            setAlertInfo({ title: "오류", message: "태그 처리 중 오류가 발생했습니다." });
        } finally {
            setIsCreatingTag(false);
        }
    };

    const handleToggleTagLink = async (tag: Tag) => {
        // A user must be logged in to modify tags.
        if (!session?.user) {
            setAlertInfo({ title: "오류", message: "로그인이 필요한 기능입니다." });
            return;
        }
        if (!taggingRestaurant) return;

        const originalRestaurant = taggingRestaurant;

        const isCurrentlyTagged = originalRestaurant.tags?.some(t => t.id === tag.id);
        
        const newTags = isCurrentlyTagged
            ? originalRestaurant.tags?.filter(t => t.id !== tag.id)
            : [...(originalRestaurant.tags || []), tag];

        const updatedRestaurant = { ...originalRestaurant, tags: newTags };
        
        handleTagsChange(updatedRestaurant);
        setTaggingRestaurant(updatedRestaurant);

        try {
            const response = await fetch(`/api/restaurants/${originalRestaurant.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tagId: tag.id, 
                    restaurant: originalRestaurant
                }),
            });

            if (!response.ok) {
                // Revert on failure
                handleTagsChange(originalRestaurant); 
                setTaggingRestaurant(originalRestaurant);
                setAlertInfo({ title: "오류", message: "태그 변경에 실패했습니다." });
            }
        } catch (error) {
            // Revert on network error
            handleTagsChange(originalRestaurant);
            setTaggingRestaurant(originalRestaurant);
            setAlertInfo({ title: "오류", message: "태그 변경 중 네트워크 오류가 발생했습니다." });
        }
    };

    const handleTagsChange = (updatedRestaurant: Restaurant) => {
        setRestaurantList(prevList => 
            prevList.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
        );
        setFavorites(prevList => 
            prevList.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
        );
    };

    const handleToggleTagPublic = async (tagId: number, currentIsPublic: boolean) => {
        const originalTags = userTags;
        setUserTags(prevTags => 
            prevTags.map(tag => 
                tag.id === tagId ? { ...tag, isPublic: !currentIsPublic } : tag
            )
        );
        try {
            const response = await fetch(`/api/tags/${tagId}/toggle-public`, { method: 'PATCH' });
            if (!response.ok) {
                setUserTags(originalTags);
                setAlertInfo({ title: "오류", message: "상태 변경에 실패했습니다." });
            }
        } catch (error) {
            setUserTags(originalTags);
            setAlertInfo({ title: "오류", message: "상태 변경 중 오류가 발생했습니다." });
        }
    };

    const handleUnsubscribe = async (tagId: number) => {
        const originalSubscriptions = subscribedTags;
        setSubscribedTags(prev => prev.filter(tag => tag.id !== tagId));
        try {
            const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
            if (!response.ok) {
                setSubscribedTags(originalSubscriptions);
                setAlertInfo({ title: "오류", message: "구독 취소에 실패했습니다." });
            }
        } catch (error) {
            setSubscribedTags(originalSubscriptions);
            setAlertInfo({ title: "오류", message: "구독 취소 중 오류가 발생했습니다." });
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        const originalTags = userTags;
        setUserTags(userTags.filter(tag => tag.id !== tagId));
        try {
            const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
            if (!response.ok) {
                setUserTags(originalTags);
                setAlertInfo({ title: "오류", message: "태그 삭제에 실패했습니다." });
            }
        } catch (error) {
            setUserTags(originalTags);
            setAlertInfo({ title: "오류", message: "태그 삭제 중 오류가 발생했습니다." });
        }
    };
    
    const handleAddressSearch = () => {
        if (!searchAddress.trim()) {
            setAlertInfo({ title: "오류", message: "검색어를 입력해주세요." });
            return;
        }

        if (!window.kakao || !window.kakao.maps.services) {
            setAlertInfo({ title: "오류", message: "지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요." });
            return;
        }

        const ps = new window.kakao.maps.services.Places();
        
        ps.keywordSearch(searchAddress, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const firstResult = data[0];
                const moveLatLon = new window.kakao.maps.LatLng(Number(firstResult.y), Number(firstResult.x));
                
                mapInstance.current?.setCenter(moveLatLon);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setAlertInfo({ title: "오류", message: "검색 결과가 존재하지 않습니다." });
            } else {
                setAlertInfo({ title: "오류", message: "검색 중 오류가 발생했습니다." });;
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
                setAlertInfo({ title: "오류", message: "주변에 조건에 맞는 음식점을 찾지 못했습니다." });
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
            setAlertInfo({ title: "오류", message: "음식점을 불러오는데 실패했습니다." });
        } finally {
            setLoading(false);
        }
    };

    const filteredTags = newTagName.trim() === ''
        ? userTags // 입력창이 비어있으면 모든 태그를 보여줌
        : userTags.filter(tag => tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()));

    return (
        <main className="w-full min-h-screen">
            <Card className="w-full min-h-screen rounded-none border-none flex flex-col items-center p-4 md:p-8">
                <div className="absolute top-4 right-4 z-50">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>메뉴</SheetTitle>
                            </SheetHeader>
                            <div className="py-4">
                                {/* 로딩 중일 때 보여줄 스켈레톤 UI */}
                                {status === 'loading' && (
                                    <div className="flex flex-col items-center gap-2 p-4">
                                        <Skeleton className="h-20 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                )}

                                {/* 비로그인 상태일 때 보여줄 UI */}
                                {status === 'unauthenticated' && (
                                    <div className="flex flex-col items-center gap-2 p-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarFallback>👤</AvatarFallback>
                                        </Avatar>
                                        <p className="mt-2 font-semibold">게스트</p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                            <Button className="w-full mt-2">로그인</Button>
                                            </DialogTrigger>
                                            {/* 이전에 만들어둔 로그인 DialogContent를 여기에 붙여넣으면 됩니다. */}
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="text-center text-2xl font-bold">
                                                        로그인
                                                    </DialogTitle>
                                                    <p className="text-sm text-muted-foreground pt-1 text-center">
                                                        이전에 사용한 계정으로 빠르게 로그인하세요.
                                                    </p>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    {/* 1. 빠른 자동 로그인을 위한 버튼 */}
                                                    <Button
                                                        onClick={() => signIn('google')}
                                                        variant="outline"
                                                        className="w-full h-12 text-lg"
                                                    >
                                                        <Image src="/google_icon.png" alt="Google" width={24} height={24} className="mr-3" />
                                                        Google로 빠른 로그인
                                                    </Button>
                                                    <Button
                                                        onClick={() => signIn('kakao')}
                                                        className="w-full h-12 text-lg bg-[#FEE500] text-black hover:bg-[#FEE500]/90"
                                                    >
                                                        <Image src="/kakao_icon.png" alt="Kakao" width={24} height={24} className="mr-3" />
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
                                                        className="w-full h-12 text-lg"
                                                    >
                                                        다른 Google 계정 사용
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => signIn('kakao', undefined, { prompt: 'select_account' })}
                                                        className="w-full h-12 text-lg"
                                                    >
                                                        다른 Kakao 계정 사용
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}

                                {/* 로그인 상태일 때 보여줄 UI */}
                                {status === 'authenticated' && session?.user && (
                                    <div className="flex flex-col items-center gap-2 p-4">
                                        <Avatar className="h-20 w-20">
                                            {/* 이제 session.user는 undefined가 아니라고 보장됩니다. */}
                                            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                            <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="mt-2 font-semibold">{session.user.name}</p>
                                        <Button variant="outline" onClick={() => signOut()} className="w-full mt-2">
                                            로그아웃
                                        </Button>
                                    </div>
                                )}
                                <Separator className="my-4" />

                                <div className="flex flex-col gap-2 px-4">
                                    <Button 
                                        variant="ghost" 
                                        className="justify-start"
                                        onClick={() => setIsFavoritesListOpen(true)}
                                    >
                                        즐겨찾기 목록
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className="justify-start"
                                        onClick={handleBlacklistClick}
                                    >
                                        블랙리스트 관리
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className="justify-start"
                                        onClick={() => setIsTagManagementOpen(true)}
                                    >
                                        태그 관리
                                    </Button>

                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="justify-start">
                                            도움말 및 정보
                                        </Button>
                                    </DialogTrigger>
                                </div>
                                <Separator className="my-4" />

                                <div className="px-4 flex items-center justify-between">
                                    <span className="text-sm font-medium">테마 변경</span>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            <Card className="w-full max-w-6xl p-6 md:p-8">
<div className="flex flex-col md:flex-row gap-6">
    {/* 왼쪽 지도 패널 */}
    <div className="w-full h-[800px] md:flex-grow rounded-lg border shadow-sm flex flex-col overflow-hidden">
        
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
        </div>
    </div>

    {/* 오른쪽 제어 패널 */}
    <div className="w-full md:w-2/5 flex flex-col items-center md:justify-start space-y-4 md:h-[800px]">
        <div className="w-full flex gap-2 justify-center">
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
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="temp-open-now"
                                    checked={tempOpenNowOnly}
                                    onCheckedChange={(checked) => setTempOpenNowOnly(Boolean(checked))}
                                />
                                <Label
                                    htmlFor="temp-open-now"
                                    className="font-semibold text-lg cursor-pointer"
                                >
                                    영업 중인 가게만 보기
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 pl-6">
                                <Checkbox
                                    id="temp-include-unknown"
                                    checked={tempIncludeUnknownHours}
                                    onCheckedChange={(checked) => setTempIncludeUnknownHours(Boolean(checked))}
                                    disabled={!tempOpenNowOnly} // '영업 중' 필터가 꺼져있으면 비활성화
                                />
                                <Label
                                    htmlFor="temp-include-unknown"
                                    className={tempOpenNowOnly ? "cursor-pointer" : "text-gray-400 dark:text-gray-500"}
                                >
                                    영업 정보 없는 가게 포함
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
                                태그로 필터링
                            </Label>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {userTags.length > 0 ? (
                                    userTags.map((tag) => (
                                        <div
                                            key={tag.id}
                                            onClick={() => handleTempTagChange(tag.id)}
                                            className={`cursor-pointer rounded-full px-3 py-1 text-sm transition-colors ${
                                                tempSelectedTags.includes(tag.id)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {tag.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        생성된 태그가 없습니다.
                                    </p>
                                )}
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
        </div>

        <Card className="w-full flex-1 flex flex-col min-h-0">
            {loading ? (
                // ✅ 로딩 중일 때 보여줄 스켈레톤 UI
                <div className="space-y-2 pr-2">
                    {/* 스켈레톤 UI를 3개 정도 반복해서 보여줍니다. */}
                    {[...Array(3)].map((_, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <Skeleton className="h-5 w-3/5" />
                                <Skeleton className="h-4 w-1/5" />
                            </div>
                            <Skeleton className="h-4 w-2/5" />
                        </Card>
                    ))}
                </div>
            ) : restaurantList.length > 0 ? (
                // 로딩이 끝났고, 결과가 있을 때
                <>
                    {blacklistExcludedCount > 0 && (
                        <div className="p-2 mx-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm text-center">
                            <p>블랙리스트에 포함된 {blacklistExcludedCount}개의 장소가 결과에서 제외되었습니다.</p>
                        </div>
                    )}
                    <p className="text-sm font-semibold text-gray-600 px-4">
                        {getSortTitle(displayedSortOrder)}:{" "}
                        {restaurantList.length}개
                    </p>
                    <CardContent className="p-2 thin-scrollbar overflow-y-auto flex-1">
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
                                    <AccordionItem value={place.id} key={place.id} className="border-none group">
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
                                                    <CardContent className="px-4 pb-3 pt-0 text-xs flex flex-col items-start gap-2">
                                                        <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                                                            <span>
                                                                {place.categoryName
                                                                    ?.split(
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
                                                        </div>
                                                        
                                                        {/* ✅ 태그 뱃지를 표시하는 부분을 여기에 추가합니다. */}
                                                        <div className="flex flex-wrap gap-1">
                                                            {place.tags?.map(tag => {
                                                                // ✅ 태그의 종류를 판별합니다.
                                                                const isMyTag = tag.creatorId === session?.user?.id;
                                                                const isSubscribedTag = subscribedTagIds.includes(tag.id);

                                                                // ✅ 종류에 따라 다른 스타일과 아이콘을 적용합니다.
                                                                const badgeVariant = isSubscribedTag ? "default" : (isMyTag ? "outline" : "secondary");
                                                                const icon = isSubscribedTag ? "★ " : "# ";

                                                                return (
                                                                    <Link key={tag.id} href={`/tags/${tag.id}`}>
                                                                        <Badge variant={badgeVariant} className="flex items-center">
                                                                            {icon}{tag.name}
                                                                        </Badge>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
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
                                                            {place.categoryName?.split('>').pop()?.trim()}
                                                        </p>
                                                        <div className="flex items-center">
                                                            {/* ✅ 블랙리스트 버튼은 로그인 상태일 때만 렌더링합니다. */}
                                                            {status === 'authenticated' && (
                                                                <>
                                                                    {/* ✅ '태그 관리' 버튼을 추가합니다. */}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => setTaggingRestaurant(place)}
                                                                        title="태그 관리"
                                                                    >
                                                                        <Tags className="text-gray-400" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => toggleBlacklist(place)}
                                                                        title={isBlacklisted(place.id) ? "블랙리스트에서 제거" : "블랙리스트에 추가"}
                                                                    >
                                                                        <EyeOff className={isBlacklisted(place.id) ? "fill-foreground" : "text-gray-400"} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {/* ✅ 즐겨찾기 버튼은 항상 보이도록 유지합니다. */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => toggleFavorite(place)}
                                                                title={isFavorite(place.id) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
                                                            >
                                                                <Heart className={isFavorite(place.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                                                            </Button>
                                                        </div>
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
                    </CardContent>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">검색 결과가 여기에 표시됩니다.</p>
                </div>
            )}
        </Card>
    </div>
</div>
                </Card>

                {/* 태그 관리 다이얼로그 */}
                <Dialog open={isTagManagementOpen} onOpenChange={setIsTagManagementOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl">태그 관리</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            {/* --- 수정 시작 --- */}
                            {/* 1. '내가 만든 태그' 섹션 */}
                            <h4 className="font-semibold mb-2 px-1">내가 만든 태그</h4>
                            <div className="flex w-full items-center space-x-2 mb-4 p-1">
                                {/* --- 수정 시작 --- */}
                                <Input
                                    type="text"
                                    placeholder="새 태그 생성 또는 검색"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTagFromManager()}
                                    disabled={isCreatingTag} 
                                />
                                <Button onClick={handleCreateTagFromManager} disabled={isCreatingTag}>
                                    {isCreatingTag ? '추가 중...' : '추가'}
                                </Button>
                                {/* --- 수정 끝 --- */}
                            </div>
                            <div className="h-[200px] overflow-y-auto pr-4">
                                {userTags.length > 0 ? (
                                    <ul className="space-y-2">
                                        {filteredTags.map(tag => (
                                            <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                <span>{tag.name}</span>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id={`public-switch-${tag.id}`}
                                                            checked={tag.isPublic}
                                                            onCheckedChange={() => handleToggleTagPublic(tag.id, tag.isPublic)}
                                                        />
                                                        <Label htmlFor={`public-switch-${tag.id}`} className="text-xs text-muted-foreground">
                                                            {tag.isPublic ? '공개' : '비공개'}
                                                        </Label>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTag(tag.id)}>삭제</Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground pt-8">
                                        {newTagName.trim() === '' ? '생성된 태그가 없습니다.' : '일치하는 태그가 없습니다.'}
                                    </p>
                                )}
                            </div>

                            <Separator className="my-4" />

                            {/* 2. '구독 중인 태그' 섹션 */}
                            <h4 className="font-semibold mb-2 px-1">구독 중인 태그</h4>
                            <div className="h-[200px] overflow-y-auto pr-4">
                                {subscribedTags.length > 0 ? (
                                    <ul className="space-y-2">
                                        {subscribedTags.map(tag => (
                                            <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                <div>
                                                    <span className="font-semibold">{tag.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">(by {tag.creatorName})</span>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(tag.id)}>구독 취소</Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground pt-8">구독 중인 태그가 없습니다.</p>
                                )}
                            </div>
                            
                            <Separator className="my-4" />
                            
                            {/* 3. 태그 범례 UI */}
                            <div className="space-y-3 px-1">
                                <h4 className="font-semibold">태그 종류 안내</h4>
                                <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default">★ 구독 태그</Badge>
                                        <span className="text-xs text-muted-foreground">구독한 사용자의 태그</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline"># 내가 만든 태그</Badge>
                                        <span className="text-xs text-muted-foreground">내가 만든 태그</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary"># 일반 태그</Badge>
                                        <span className="text-xs text-muted-foreground">다른 사용자의 공개 태그</span>
                                    </div>
                                </div>
                            </div>
                            {/* --- 수정 끝 --- */}
                        </div>
                    </DialogContent>
                </Dialog>

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
                                            <AccordionItem value={place.id} key={place.id} className="border-none group">
                                                <Card className="mb-2 shadow-sm transition-colors group-data-[state=closed]:hover:bg-accent group-data-[state=open]:bg-muted">
                                                    <AccordionTrigger className="text-left hover:no-underline p-0 [&_svg]:hidden">
                                                        <div className="w-full">
                                                            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                                                                <CardTitle className="text-md">
                                                                    {place.placeName}
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="px-4 pb-3 pt-0 text-xs flex flex-col items-start gap-2">
                                                                <div className="w-full flex justify-between items-center text-gray-600 dark:text-gray-400">
                                                                    <span>
                                                                        {place.categoryName
                                                                            ?.split(
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
                                                                </div>
                                                                
                                                                {/* ✅ 태그 뱃지를 표시하는 부분을 여기에 추가합니다. */}
                                                                <div className="flex flex-wrap gap-1">
                                                                    {place.tags?.map(tag => {
                                                                        // ✅ 태그의 종류를 판별합니다.
                                                                        const isMyTag = tag.creatorId === session?.user?.id;
                                                                        const isSubscribedTag = subscribedTagIds.includes(tag.id);

                                                                        // ✅ 종류에 따라 다른 스타일과 아이콘을 적용합니다.
                                                                        const badgeVariant = isSubscribedTag ? "default" : (isMyTag ? "outline" : "secondary");
                                                                        const icon = isSubscribedTag ? "★ " : "# ";

                                                                        return (
                                                                            <Link key={tag.id} href={`/tags/${tag.id}`}>
                                                                                <Badge variant={badgeVariant} className="flex items-center">
                                                                                    {icon}{tag.name}
                                                                                </Badge>
                                                                            </Link>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </CardContent>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div
                                                            className="px-4 pb-4 text-sm space-y-3 border-t"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-between pt-2">
                                                                <p className="text-xs text-gray-500">
                                                                    {place.categoryName?.split('>').pop()?.trim()}
                                                                </p>
                                                                <div className="flex items-center">
                                                                    {/* 블랙리스트 버튼은 로그인 상태일 때만 렌더링 */}
                                                                    {status === 'authenticated' && (
                                                                        <>
                                                                            {/* ✅ '태그 관리' 버튼을 추가합니다. */}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                onClick={() => setTaggingRestaurant(place)}
                                                                                title="태그 관리"
                                                                            >
                                                                                <Tags className="text-gray-400" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                onClick={() => toggleBlacklist(place)}
                                                                                title={isBlacklisted(place.id) ? "블랙리스트에서 제거" : "블랙리스트에 추가"}
                                                                            >
                                                                                <EyeOff className={isBlacklisted(place.id) ? "fill-foreground" : "text-gray-400"} />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    {/* 즐겨찾기 버튼은 항상 보이도록 유지 */}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => toggleFavorite(place)}
                                                                        title={isFavorite(place.id) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
                                                                    >
                                                                        <Heart className={isFavorite(place.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                                                                    </Button>
                                                                </div>
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

                <Dialog open={isBlacklistOpen} onOpenChange={setIsBlacklistOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl">블랙리스트 관리</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto pr-4 mt-4">
                            {blacklist.length > 0 ? (
                                // ✅ ul 내부를 실제 데이터로 채우고 [삭제] 버튼을 추가합니다.
                                <ul className="space-y-3">
                                    {blacklist.map((place) => (
                                        <li key={place.id} className="flex items-center justify-between p-2 rounded-md border">
                                            <div>
                                                <p className="font-semibold">{place.placeName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {place.categoryName?.split('>').pop()?.trim()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleBlacklist(place)}
                                            >
                                                삭제
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>블랙리스트에 등록된 음식점이 없습니다.</p>
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
                <Dialog open={!!taggingRestaurant} onOpenChange={() => setTaggingRestaurant(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>태그 관리: {taggingRestaurant?.placeName}</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            {/* 새로운 태그 생성 UI */}
                            <div className="flex w-full items-center space-x-2 mb-4">
                                <Input
                                    type="text"
                                    placeholder="새 태그 이름 (예: #가성비)"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                                />
                                <Button onClick={handleCreateTag}>추가</Button>
                            </div>

                            {/* 기존 태그 목록 UI */}
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">내 태그 목록</p>
                                {/* ✅ userTags 대신 filteredTags를 사용 */}
                                {filteredTags.map((tag) => (
                                    <div key={tag.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`tag-${tag.id}`}
                                            checked={taggingRestaurant?.tags?.some(rt => rt.id === tag.id)}
                                            onCheckedChange={() => handleToggleTagLink(tag)}
                                        />
                                        <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                                            {tag.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <AlertDialog open={!!alertInfo} onOpenChange={() => setAlertInfo(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{alertInfo?.title}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                            {alertInfo?.message}
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setAlertInfo(null)}>확인</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </main>
    );
}