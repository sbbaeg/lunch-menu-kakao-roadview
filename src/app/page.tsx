"use client";
//리펙토링한 컴포넌트
import { FilterDialog, type FilterState } from "@/components/FilterDialog"; //필터
import { FavoritesDialog } from "@/components/FavoritesDialog"; //즐겨찾기
import { BlacklistDialog } from "@/components/BlacklistDialog"; //블랙리스트
import { TagManagementDialog } from "@/components/TagManagementDialog"; //태그관리
import { TaggingDialog } from "@/components/TaggingDialog"; //태그
import { ResultPanel } from "@/components/ResultPanel"; //오른쪽 결과
import { MapPanel } from "@/components/MapPanel";  //지도
import { MainControlPanel } from "@/components/MainControlPanel"; //오른쪽 버튼
import { RouletteDialog } from "@/components/RouletteDialog"; //룰렛
import { SideMenuSheet } from "@/components/SideMenuSheet"; //사이드햄버거메뉴

//논리구조 리펙토링
import { useFavorites } from "@/hooks/useFavorites";
import { useBlacklist } from "@/hooks/useBlacklist";
import { useUserTags } from "@/hooks/useUserTags";
import { useSubscriptions } from "@/hooks/useSubscriptions";



import { AppRestaurant, KakaoPlaceItem, GoogleOpeningHours, RestaurantWithTags } from '@/lib/types';

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

    const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
    const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
    const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
    const { subscribedTagIds } = useSubscriptions();


    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [restaurantList, setRestaurantList] = useState<AppRestaurant[]>([]);
    const [rouletteItems, setRouletteItems] = useState<AppRestaurant[]>([]);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDistance, setSelectedDistance] = useState<string>("800");
    const [sortOrder, setSortOrder] = useState<
        "accuracy" | "distance" | "rating"
    >("accuracy");
    const [resultCount, setResultCount] = useState<number>(5);
    const [minRating, setMinRating] = useState<number>(4.0);

    const [displayedSortOrder, setDisplayedSortOrder] = useState<
        "accuracy" | "distance" | "rating"
    >("accuracy");

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchInFavoritesOnly, setSearchInFavoritesOnly] = useState(false);

    const [openNowOnly, setOpenNowOnly] = useState(false);
    const [includeUnknownHours, setIncludeUnknownHours] = useState(true); // 정보 없는 가게 포함 여부 (기본값 true)

    const [selectedTags, setSelectedTags] = useState<number[]>([]); // 실제 적용될 태그 ID 목록


    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);

    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false); // 관리 팝업을 여닫을 상태
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false); // 태그 관리 팝업 상태
    const [blacklistExcludedCount, setBlacklistExcludedCount] = useState<number>(0);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

    const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null); // 현재 태그를 편집할 음식점 정보

    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        console.log("CCTV 2: 'favorites' 상태 변경됨", favorites);
    }, [favorites]);

    const [loading, setLoading] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

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
    ): Promise<AppRestaurant[]> => { // ✅ 반환 타입을 Restaurant[]으로 변경
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

        apiUrl += `&_=${new Date().getTime()}`;

        const response = await fetch(apiUrl);
        const data: { documents?: RestaurantWithTags[], blacklistExcludedCount?: number, tagExcludedCount?: number } = await response.json();

        const formattedRestaurants: AppRestaurant[] = (data.documents || []).map(place => ({
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
                            setRestaurantList(restaurants);
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

    const clearMapAndResults = () => {
        setSelectedItemId(undefined);
        setRestaurantList([]);
    };

    const handleRouletteResult = (winner: AppRestaurant) => {
        setRestaurantList([winner]);
        setSelectedItemId(winner.id);
    };

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
            // 1. 훅의 createTag 함수를 호출하고, 생성된 태그를 반환받습니다.
            const newTag = await createTag(name);

            // 2. 태그 생성이 성공했을 때만(newTag가 null이 아닐 때) 연결 로직을 실행합니다.
            if (newTag) {
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

    const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
        setRestaurantList(prevList => 
            prevList.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
        );
        updateFavoriteInList(updatedRestaurant);
    };

    return (
        <main className="w-full min-h-screen">
            <Card className="w-full min-h-screen rounded-none border-none flex flex-col items-center p-4 md:p-8">
                <div className="absolute top-4 right-4 z-50">
                    <SideMenuSheet
                        onShowFavorites={() => setIsFavoritesListOpen(true)}
                        onShowBlacklist={handleBlacklistClick}
                        onShowTagManagement={() => setIsTagManagementOpen(true)}
                    />
                </div>
            <Card className="w-full max-w-6xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-3/5 h-[400px] md:h-auto">
                        <MapPanel
                            restaurants={restaurantList}
                            selectedRestaurant={restaurantList.find(r => r.id === selectedItemId) || null}
                            userLocation={userLocation}
                            onSearchInArea={handleSearchInArea}
                            onAddressSearch={handleAddressSearch}
                            onMapReady={setIsMapReady}
                        />
                    </div>

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
                    onCreateTag={createTag}
                    onDeleteTag={deleteTag}
                    onToggleTagPublic={toggleTagPublic}
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

                <RouletteDialog
                    isOpen={isRouletteOpen}
                    onOpenChange={setIsRouletteOpen}
                    items={rouletteItems}
                    onResult={handleRouletteResult}
                />

                <TaggingDialog
                    restaurant={taggingRestaurant}
                    onOpenChange={() => setTaggingRestaurant(null)}
                    userTags={userTags}
                    onToggleTagLink={handleToggleTagLink}
                    onCreateAndLinkTag={handleCreateTag}
                />

                <AlertDialog open={!!alertInfo} onOpenChange={() => setAlertInfo(null)}>
                    <AlertDialogContent className="max-w-lg">
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