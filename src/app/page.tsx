"use client";
//리펙토링한 컴포넌트
import { FilterDialog, type FilterState } from "@/components/FilterDialog";
import { FavoritesDialog } from "@/components/FavoritesDialog"; 
import { BlacklistDialog } from "@/components/BlacklistDialog";
import { TagManagementDialog } from "@/components/TagManagementDialog";
import { TaggingDialog } from "@/components/TaggingDialog";
import { ResultPanel } from "@/components/ResultPanel";
import { MapPanel } from "@/components/MapPanel"; 
import { MainControlPanel } from "@/components/MainControlPanel";


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



// page.tsx 컴포넌트 내부에서만 사용하는 타입들
interface RouletteOption {
    option: string;
    style?: { backgroundColor?: string; textColor?: string };
}

const Wheel = dynamic(
    () => import("react-custom-roulette").then((mod) => mod.Wheel),
    { ssr: false }
);

// --- 타입 정의 끝 ---

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
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
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
    const [searchInFavoritesOnly, setSearchInFavoritesOnly] = useState(false);

    const [openNowOnly, setOpenNowOnly] = useState(false);
    const [includeUnknownHours, setIncludeUnknownHours] = useState(true); // 정보 없는 가게 포함 여부 (기본값 true)

    const [selectedTags, setSelectedTags] = useState<number[]>([]); // 실제 적용될 태그 ID 목록


    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);

    const [blacklist, setBlacklist] = useState<Restaurant[]>([]); // 관리 목록을 담을 상태
    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false); // 관리 팝업을 여닫을 상태
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false); // 태그 관리 팝업 상태
    const [blacklistExcludedCount, setBlacklistExcludedCount] = useState<number>(0);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

    const [taggingRestaurant, setTaggingRestaurant] = useState<Restaurant | null>(null); // 현재 태그를 편집할 음식점 정보
    const [userTags, setUserTags] = useState<Tag[]>([]);
    const [subscribedTagIds, setSubscribedTagIds] = useState<number[]>([]);

    const [isHelpOpen, setIsHelpOpen] = useState(false);

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

    const [loading, setLoading] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    
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

        if (searchInFavoritesOnly) {
            apiUrl += `&fromFavorites=true`;
        }

        const response = await fetch(apiUrl);
        const data: { documents?: RestaurantWithTags[], blacklistExcludedCount?: number, tagExcludedCount?: number } = await response.json();

        const formattedRestaurants: Restaurant[] = (data.documents || []).map(place => ({
            id: place.id,
            kakaoPlaceId: place.id,
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

    const recommendProcess = (isRoulette: boolean) => {
        setLoading(true);
        setDisplayedSortOrder(sortOrder);
        setBlacklistExcludedCount(0);
        clearMapAndResults();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                try {
                    const restaurants = await getNearbyRestaurants(latitude, longitude);

                    if (restaurants.length === 0) {
                        setAlertInfo({ title: "알림", message: "주변에 조건에 맞는 음식점을 찾지 못했어요!" });
                    } else {
                        // 룰렛일 경우
                        if (isRoulette) {
                            if (restaurants.length < 2) {
                                setAlertInfo({ title: "알림", message: `주변에 추첨할 음식점이 ${resultCount}개 미만입니다.` });
                            } else {
                                setRouletteItems(restaurants);
                                setIsRouletteOpen(true);
                            }
                        } 
                        // 일반 검색일 경우
                        else {
                            const finalRestaurants = (sortOrder === 'distance' || sortOrder === 'rating')
                                ? restaurants
                                : [...restaurants].sort(() => 0.5 - Math.random()).slice(0, resultCount);
                            setRestaurantList(finalRestaurants);
                        }
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

    const handleApplyFilters = (newFilters: FilterState) => {
        setSelectedCategories(newFilters.categories);
        setSelectedDistance(newFilters.distance);
        setSortOrder(newFilters.sortOrder);
        setResultCount(newFilters.resultCount);
        setMinRating(newFilters.minRating);
        setSearchInFavoritesOnly(newFilters.searchInFavoritesOnly);
        setOpenNowOnly(newFilters.openNowOnly);
        setIncludeUnknownHours(newFilters.includeUnknownHours);
        setSelectedTags(newFilters.tags);
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

    const handleCreateTagFromManager = async (name: string) => {
        // isCreatingTag 상태는 이제 Dialog 컴포넌트가 자체 관리하므로 여기서 필요 없습니다.
        try {
            const createResponse = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (createResponse.ok) {
                const newTag = await createResponse.json();
                setUserTags(prevTags => [...prevTags, newTag]);
                // newTagName 상태도 Dialog가 관리하므로 여기서 초기화할 필요가 없습니다.
            } else {
                setAlertInfo({ title: "오류", message: "태그 생성에 실패했거나 이미 존재하는 태그입니다." });
            }
        } catch (error) {
            console.error("태그 생성 오류:", error);
            setAlertInfo({ title: "오류", message: "태그 생성 중 오류가 발생했습니다." });
        }
    };

    const handleSearchInArea = async (center: { lat: number; lng: number }) => {
        setLoading(true);
        clearMapAndResults();
        try {
            const restaurants = await getNearbyRestaurants(center.lat, center.lng);
            if (restaurants.length === 0) {
                setAlertInfo({ title: "알림", message: "주변에 조건에 맞는 음식점을 찾지 못했어요!" });
            } else {
                const finalRestaurants = (sortOrder === 'distance' || sortOrder === 'rating')
                    ? restaurants
                    : [...restaurants].sort(() => 0.5 - Math.random()).slice(0, resultCount);
                setRestaurantList(finalRestaurants);
            }
        } catch (error) {
            console.error("Error:", error);
            setAlertInfo({ title: "오류", message: "음식점을 불러오는 데 실패했습니다." });
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSearch = async (keyword: string, mode: 'place' | 'food', center: { lat: number; lng: number }) => {
        if (!keyword.trim()) {
            setAlertInfo({ title: "알림", message: "검색어를 입력해주세요." });
            return;
        }

        if (mode === 'food') {
            setLoading(true);
            clearMapAndResults();
            setDisplayedSortOrder(sortOrder);

            try {
                let apiUrl = `/api/recommend?lat=${center.lat}&lng=${center.lng}&query=${encodeURIComponent(keyword)}&radius=${selectedDistance}&sort=${sortOrder}&size=${resultCount}&minRating=${minRating}&openNow=${openNowOnly}&includeUnknown=${includeUnknownHours}`;
                if (selectedTags.length > 0) {
                    apiUrl += `&tags=${selectedTags.join(',')}`;
                }
                const response = await fetch(apiUrl);
                const data = await response.json();
                const formattedRestaurants = (data.documents || []).map((place: RestaurantWithTags) => ({
                    // ... (이전 getNearbyRestaurants와 동일한 포맷팅 로직)
                    id: place.id, kakaoPlaceId: place.id, placeName: place.place_name, categoryName: place.category_name, address: place.road_address_name, x: place.x, y: place.y, placeUrl: place.place_url, distance: place.distance, googleDetails: place.googleDetails, tags: place.tags
                }));
                setRestaurantList(formattedRestaurants);
                setBlacklistExcludedCount(data.blacklistExcludedCount || 0);

                if (formattedRestaurants.length === 0) {
                    setAlertInfo({ title: "알림", message: "주변에 조건에 맞는 음식점을 찾지 못했어요!" });
                }
            } catch (error) {
                setAlertInfo({ title: "오류", message: "검색 중 오류가 발생했습니다." });
            } finally {
                setLoading(false);
            }
        }
        // 'place' 모드는 MapPanel이 자체적으로 처리하므로 page.tsx에서는 로직이 필요 없습니다.
    };

    const handleCreateTag = async (name: string) => {
        if (!name.trim() || !taggingRestaurant) return;

        try {
            const createResponse = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!createResponse.ok) {
                setAlertInfo({ title: "오류", message: "태그 생성에 실패했거나 이미 존재하는 태그입니다." });
                return;
            }

            const newTag = await createResponse.json();
            setUserTags(prevTags => [...prevTags, newTag]);

            const linkResponse = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId: newTag.id, restaurant: taggingRestaurant }),
            });

            if (linkResponse.ok) {
                const updatedRestaurant = {
                    ...taggingRestaurant,
                    tags: [...(taggingRestaurant.tags || []), newTag],
                };
                handleTagsChange(updatedRestaurant);
                setTaggingRestaurant(updatedRestaurant);
            } else {
                setAlertInfo({ title: "오류", message: "태그 연결에 실패했습니다." });
            }
        } catch (error) {
            console.error("태그 생성 및 연결 오류:", error);
            setAlertInfo({ title: "오류", message: "태그 처리 중 오류가 발생했습니다." });
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

                                    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" className="justify-start">
                                                도움말 및 정보
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>도움말 및 정보</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4 text-sm">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold">기본 기능</h3>
                                                    <ul className="list-disc list-inside text-muted-foreground">
                                                        <li><strong>검색/룰렛:</strong> 현재 위치나 지도 중앙을 기준으로 주변 음식점을 검색하거나 룰렛으로 추첨합니다.</li>
                                                        <li><strong>필터:</strong> 카테고리, 거리, 별점 등 다양한 조건으로 검색 결과를 좁힐 수 있습니다.</li>
                                                    </ul>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold">지도 기능</h3>
                                                    <ul className="list-disc list-inside text-muted-foreground">
                                                        <li><strong>지도 검색창:</strong> 특정 장소(예: 강남역)를 검색하여 지도를 해당 위치로 이동시킬 수 있습니다.</li>
                                                        <li><strong>이 지역에서 재검색:</strong> 지도를 드래그하여 옮긴 후 버튼을 누르면, 현재 보이는 지도 중앙을 기준으로 다시 검색합니다.</li>
                                                    </ul>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold">개인화 기능 (로그인)</h3>
                                                    <ul className="list-disc list-inside text-muted-foreground">
                                                        <li><strong>즐겨찾기:</strong> 마음에 드는 가게를 저장하고 필터에서 '즐겨찾기만' 선택해 볼 수 있습니다.</li>
                                                        <li><strong>블랙리스트:</strong> 보고 싶지 않은 가게를 목록에서 숨깁니다.</li>
                                                        <li><strong>태그:</strong> '#혼밥'처럼 나만의 태그를 만들고 가게에 붙여 관리할 수 있습니다.
                                                            <ul className="list-['-_'] list-inside ml-4 mt-1 space-y-1">
                                                                <li><Badge variant="outline" className="mr-1 cursor-default">#내 태그</Badge> : 내가 만든 태그</li>
                                                                <li><Badge variant="default" className="mr-1 cursor-default">★ 구독 태그</Badge> : 내가 구독한 태그</li>
                                                                <li><Badge variant="secondary" className="mr-1 cursor-default"># 공개 태그</Badge> : 다른 사람이 공개한 태그</li>
                                                            </ul>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
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
    <MapPanel
        restaurants={restaurantList}
        selectedRestaurant={restaurantList.find(r => r.id === selectedItemId) || null}
        userLocation={userLocation}
        onSearchInArea={handleSearchInArea}
        onAddressSearch={handleAddressSearch}
        onMapReady={setIsMapReady}
    />

    {/* 오른쪽 제어 패널 */}
    <div className="w-full md:w-2/5 flex flex-col items-center md:justify-start space-y-4 md:h-[800px]">
        <MainControlPanel
            isSearchDisabled={loading || !isMapReady}
            onSearchClick={() => recommendProcess(false)}
            onRouletteClick={() => recommendProcess(true)}
            onFilterClick={() => setIsFilterOpen(true)}
        />
        <ResultPanel
            isLoading={loading}
            restaurants={restaurantList}
            blacklistExcludedCount={blacklistExcludedCount}
            displayedSortOrder={displayedSortOrder}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            session={session}
            subscribedTagIds={subscribedTagIds}
            isFavorite={isFavorite}
            isBlacklisted={isBlacklisted}
            onToggleFavorite={toggleFavorite}
            onToggleBlacklist={toggleBlacklist}
            onTagManagement={setTaggingRestaurant}
        />
    </div>
</div>
                </Card>

                <FilterDialog
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    initialFilters={{
                        categories: selectedCategories,
                        distance: selectedDistance,
                        sortOrder: sortOrder,
                        resultCount: resultCount,
                        minRating: minRating,
                        searchInFavoritesOnly: searchInFavoritesOnly,
                        openNowOnly: openNowOnly,
                        includeUnknownHours: includeUnknownHours,
                        tags: selectedTags,
                    }}
                    onApplyFilters={handleApplyFilters}
                    userTags={userTags}
                />

                <TagManagementDialog
                    isOpen={isTagManagementOpen}
                    onOpenChange={setIsTagManagementOpen}
                    userTags={userTags}
                    onCreateTag={handleCreateTagFromManager}
                    onDeleteTag={handleDeleteTag}
                    onToggleTagPublic={handleToggleTagPublic}
                />

                <FavoritesDialog
                    isOpen={isFavoritesListOpen}
                    onOpenChange={setIsFavoritesListOpen}
                    favorites={favorites}
                    session={session}
                    subscribedTagIds={subscribedTagIds}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    isFavorite={isFavorite}
                    isBlacklisted={isBlacklisted}
                    onToggleFavorite={toggleFavorite}
                    onToggleBlacklist={toggleBlacklist}
                    onTagManagement={setTaggingRestaurant}
                />

                <BlacklistDialog
                    isOpen={isBlacklistOpen}
                    onOpenChange={setIsBlacklistOpen}
                    blacklist={blacklist}
                    onToggleBlacklist={toggleBlacklist}
                />

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
                                            const winner = rouletteItems[prizeNumber];
                                            setRestaurantList([winner]);
                                            setSelectedItemId(winner.id);
                                            // displayMarkers, updateViews 호출은 MapPanel이 알아서 처리하므로 삭제
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
                <TaggingDialog
                    restaurant={taggingRestaurant}
                    onOpenChange={() => setTaggingRestaurant(null)}
                    userTags={userTags}
                    onToggleTagLink={handleToggleTagLink}
                    onCreateAndLinkTag={handleCreateTag}
                />
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