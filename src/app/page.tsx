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


import { useAppStore } from '@/store/useAppStore';


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

    // --- 스토어에서 '상태(State)' 가져오기 ---
    const {
        selectedItemId,
        restaurantList,
        userLocation,
        filters,
        displayedSortOrder,
        blacklistExcludedCount,
        loading,
        isMapReady
    } = useAppStore((state) => ({
        selectedItemId: state.selectedItemId,
        restaurantList: state.restaurantList,
        userLocation: state.userLocation,
        filters: state.filters,
        displayedSortOrder: state.displayedSortOrder,
        blacklistExcludedCount: state.blacklistExcludedCount,
        loading: state.loading,
        isMapReady: state.isMapReady,
    }));

    // --- 스토어에서 '액션(Functions)' 가져오기 ---
    const {
        setSelectedItemId,
        setFilters,
        setIsMapReady,
        recommendProcess,
        handleSearchInArea,
        handleAddressSearch,
        handleRouletteResult,
        handleTagsChange: updateRestaurantInStore // 이름 변경
    } = useAppStore((state) => ({
        setSelectedItemId: state.setSelectedItemId,
        setFilters: state.setFilters,
        setIsMapReady: state.setIsMapReady,
        recommendProcess: state.recommendProcess,
        handleSearchInArea: state.handleSearchInArea,
        handleAddressSearch: state.handleAddressSearch,
        handleRouletteResult: state.handleRouletteResult,
        handleTagsChange: state.handleTagsChange,
    }));

    const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
    const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
    const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
    const { subscribedTagIds } = useSubscriptions();

    const [isRouletteOpen, setIsRouletteOpen] = useState(false);

    const [isFilterOpen, setIsFilterOpen] = useState(false);



    const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);

    const [isBlacklistOpen, setIsBlacklistOpen] = useState(false); // 관리 팝업을 여닫을 상태
    const [isTagManagementOpen, setIsTagManagementOpen] = useState(false); // 태그 관리 팝업 상태
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

    const [taggingRestaurant, setTaggingRestaurant] = useState<AppRestaurant | null>(null); // 현재 태그를 편집할 음식점 정보

    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        console.log("CCTV 2: 'favorites' 상태 변경됨", favorites);
    }, [favorites]);

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

    const handleSearchClick = async () => {
        const result = await recommendProcess(false); // 스토어 액션 호출
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        } else if (result.isRoulette) {
            setIsRouletteOpen(true); // 룰렛 다이얼로그 열기
        }
    };
    
    const handleRouletteClick = async () => {
        const result = await recommendProcess(true); // 스토어 액션 호출
        if (!result.success && result.message) {
            setAlertInfo({ title: "알림", message: result.message });
        } else if (result.isRoulette) {
            setIsRouletteOpen(true);
        }
    };

    // 필터 적용 핸들러
    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters); // 스토어 액션을 바로 호출
    };

    // 태그 변경 핸들러 (handleCreateTag, handleToggleTagLink 내부에서 사용됨)
    const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
        updateRestaurantInStore(updatedRestaurant); // 1. 스토어의 목록 업데이트
        updateFavoriteInList(updatedRestaurant);    // 2. useFavorites의 목록 업데이트
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
                            onAddressSearch={(keyword, mode, center) => {
                                // MapPanel의 mode 인자는 무시하고, 
                                // 스토어의 handleAddressSearch에는 keyword와 center만 전달
                                handleAddressSearch(keyword, center); 
                            }}
                            onMapReady={setIsMapReady}
                        />
                    </div>

                    {/* 오른쪽 제어 패널 */}
                    <div className="w-full md:w-2/5 flex flex-col items-center md:justify-start space-y-4 md:h-[800px]">
                        <MainControlPanel
                            isSearchDisabled={loading || !isMapReady} 
                            onSearchClick={handleSearchClick} 
                            onRouletteClick={handleRouletteClick} 
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
                    initialFilters={filters} // ⬅️ 스토어 상태
                    onApplyFilters={handleApplyFilters} // ⬅️ 위에서 만든 핸들러
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
                    items={useAppStore.getState().rouletteItems} 
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