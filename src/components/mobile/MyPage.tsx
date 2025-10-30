'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Heart, EyeOff, Tags, FileText, ThumbsUp, Trophy } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAppStore } from "@/store/useAppStore";

interface MyPageProps {
    onShowFavorites: () => void;
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
    onShowLikedRestaurants: () => void;
    onShowRanking: () => void;
}

export default function MyPage({ 
    onShowFavorites,
    onShowBlacklist,
    onShowTagManagement,
    onShowLikedRestaurants,
    onShowRanking,
}: MyPageProps) {
    const { data: session, status } = useSession();
    const showTagExplore = useAppStore((state) => state.showTagExplore);
    const showMyReviews = useAppStore((state) => state.showMyReviews);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // This useEffect is for stopping wheel propagation on the help dialog, 
    // which might not be necessary in this page layout, but we keep it for consistency.
    useEffect(() => {
        const scrollArea = scrollRef.current;
        const handleWheel = (event: WheelEvent) => {
            event.stopPropagation();
        };
        if (scrollArea) {
            scrollArea.addEventListener('wheel', handleWheel);
        }
        return () => {
            if (scrollArea) {
                scrollArea.removeEventListener('wheel', handleWheel);
            }
        };
    }, [isHelpOpen]);

    const renderAuthSection = () => {
        if (!isMounted || status === 'loading') {
            return (
                <div className="flex flex-col items-center gap-2 p-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            );
        }

        if (status === 'unauthenticated') {
            return (
                <div className="flex flex-col items-center gap-2 p-4">
                    <Avatar className="h-20 w-20">
                        <AvatarFallback>👤</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-semibold">게스트</p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full mt-2">로그인</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-center text-2xl font-bold">로그인</DialogTitle>
                                <p className="text-sm text-muted-foreground pt-1 text-center">
                                    이전에 사용한 계정으로 빠르게 로그인하세요.
                                </p>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Button onClick={() => signIn('google')} variant="outline" className="w-full h-12 text-lg">
                                    <Image src="/google_icon.png" alt="Google" width={24} height={24} className="mr-3" />
                                    Google로 빠른 로그인
                                </Button>
                                <Button onClick={() => signIn('kakao')} className="w-full h-12 text-lg bg-[#FEE500] text-black hover:bg-[#FEE500]/90">
                                    <Image src="/kakao_icon.png" alt="Kakao" width={24} height={24} className="mr-3" />
                                    Kakao로 빠른 로그인
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }

        if (status === 'authenticated' && session?.user) {
            return (
                <div className="flex flex-col items-center gap-2 p-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                        <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-semibold">{session.user.name}</p>
                    <Button variant="outline" onClick={() => signOut()} className="w-full mt-2">
                        로그아웃
                    </Button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-full w-full flex flex-col">
            <header className="p-4 border-b flex-shrink-0">
                <h1 className="text-2xl font-bold">마이페이지</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="py-4">
                    {renderAuthSection()}
                    
                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        <h3 className="text-lg font-semibold mb-2">내 활동 관리</h3>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowFavorites}>
                            <Heart className="mr-2 h-4 w-4" /> 즐겨찾기 목록
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowLikedRestaurants}>
                            <ThumbsUp className="mr-2 h-4 w-4" /> 좋아요한 음식점
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showMyReviews}>
                            <FileText className="mr-2 h-4 w-4" /> 내 리뷰
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowBlacklist}>
                            <EyeOff className="mr-2 h-4 w-4" /> 블랙리스트 관리
                        </Button>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="w-full p-2 pl-3 text-sm font-medium hover:no-underline hover:bg-accent rounded-md justify-between">
                                    <div className="flex items-center" style={{ gap: '1.125rem' }}>
                                        <Tags className="h-4 w-4" />
                                        <span>태그</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                    <div className="flex flex-col pl-4 pt-2">
                                        <Button variant="ghost" className="justify-start w-full" onClick={onShowTagManagement}>- 태그 관리</Button>
                                        <Button variant="ghost" className="justify-start w-full" onClick={showTagExplore}>- 태그 탐색</Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        <h3 className="text-lg font-semibold mb-2">탐색</h3>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowRanking}>
                            <Trophy className="mr-2 h-4 w-4" /> 음식점 랭킹
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="px-4">
                        <h3 className="text-lg font-semibold mb-2">앱 설정</h3>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                            <span className="text-sm font-medium">테마 변경</span>
                            <ThemeToggle />
                        </div>
                    </div>

                    <Separator className="my-4" />

                     <div className="px-4">
                                                <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="justify-start w-full p-2">도움말 및 정보</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg flex flex-col h-[85vh] p-0">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle>사용 가이드</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground px-6">
                                    본 앱의 주요 기능과 사용법을 안내합니다.
                                </p>
                                <Tabs defaultValue="quickstart" className="w-full flex flex-col flex-1 min-h-0 pt-4" ref={scrollRef}>
                                    <TabsList className="grid w-full grid-cols-5 mx-6 w-auto">
                                        <TabsTrigger value="quickstart">기본</TabsTrigger>
                                        <TabsTrigger value="map">지도</TabsTrigger>
                                        <TabsTrigger value="personal">개인화</TabsTrigger>
                                        <TabsTrigger value="reviews">리뷰/평가</TabsTrigger>
                                        <TabsTrigger value="explore">탐색</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="quickstart" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">필터</h4>
                                                <p className="text-sm text-muted-foreground">음식 종류, 거리, 별점, 태그 등 다양한 조건으로 검색 결과를 제한합니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">검색</h4>
                                                <p className="text-sm text-muted-foreground">설정된 필터 조건에 맞는 음식점 목록을 지도와 목록에 표시합니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">룰렛</h4>
                                                <p className="text-sm text-muted-foreground">검색된 결과 내에서 무작위로 하나의 음식점을 선택하여 제시합니다.</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="map" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">지도 영역 검색</h4>
                                                <p className="text-sm text-muted-foreground">지도를 이동하면 '현 지도에서 검색' 버튼이 활성화됩니다. 이 버튼을 사용하면 현재 보이는 지도 영역 내에서 다시 검색을 수행합니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">검색 모드 전환</h4>
                                                <p className="text-sm text-muted-foreground">지도 상단 검색창 옆의 스위치를 사용하여 '장소' 또는 '음식점' 검색 모드를 선택할 수 있습니다.</p>
                                                <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
                                                    <li><strong>장소 검색:</strong> 특정 지역이나 장소 이름으로 검색하여 지도를 해당 위치로 이동시킬 수 있습니다.</li>
                                                    <li><strong>음식점 검색:</strong> 원하는 메뉴나 식당 이름으로 검색하여 현재 지도 영역 내의 관련 음식점을 찾을 수 있습니다.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="personal" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">즐겨찾기</h4>
                                                <p className="text-sm text-muted-foreground">특정 음식점을 즐겨찾기에 추가하여 빠르게 다시 찾거나, 필터에서 '즐겨찾기에서만 검색' 옵션을 사용할 수 있습니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">블랙리스트</h4>
                                                <p className="text-sm text-muted-foreground">특정 음식점을 블랙리스트에 추가하면, 모든 검색 결과에서 해당 음식점이 제외됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">태그 관리</h4>
                                                <p className="text-sm text-muted-foreground mb-3">사용자는 직접 태그를 생성하여 음식점을 분류하고 관리할 수 있습니다. 태그는 공개/비공개로 설정할 수 있으며, 사이드 메뉴의 '태그 관리'에서 내가 만든 모든 태그를 수정하거나 삭제할 수 있습니다.</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="default" className="shrink-0">★ 구독 태그</Badge>
                                                        <span className="text-xs text-muted-foreground">- 다른 사용자의 유용한 공개 태그</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="shrink-0"># 내 태그</Badge>
                                                        <span className="text-xs text-muted-foreground">- 내가 직접 생성한 태그</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="shrink-0"># 기타 공개 태그</Badge>
                                                        <span className="text-xs text-muted-foreground">- 다른 사용자가 생성한 공개 태그</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="reviews" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">평점 시스템</h4>
                                                <p className="text-sm text-muted-foreground">본 앱은 두 종류의 평점 정보를 제공합니다. 구글(Google)에 등록된 평점과 본 앱 사용자(User)가 직접 기록한 평점이 함께 표시됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">리뷰 기능</h4>
                                                <p className="text-sm text-muted-foreground">각 음식점의 상세 페이지에서 해당 음식점에 대한 사용자 리뷰를 조회하고 작성할 수 있습니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">좋아요/싫어요</h4>
                                                <p className="text-sm text-muted-foreground">음식점 상세 정보에서 해당 음식점에 대한 선호도를 '좋아요' 또는 '싫어요'로 표시할 수 있습니다. 이 평가는 '명예의 전당' 랭킹에 반영됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">베스트 리뷰</h4>
                                                <p className="text-sm text-muted-foreground">다른 사용자에게 '추천'을 많이 받은 리뷰는 '베스트 리뷰'로 선정되어, 정렬 순서와 관계없이 항상 리뷰 목록 최상단에 노출됩니다.</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="explore" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">명예의 전당</h4>
                                                <p className="text-sm text-muted-foreground">사용자들의 '좋아요' 평가를 기반으로 인기 음식점의 순위를 보여줍니다. '좋아요'를 5개 이상 받은 음식점 중에서 '좋아요 비율'이 높은 순서대로 정렬됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">태그 탐색</h4>
                                                <p className="text-sm text-muted-foreground">다른 사용자들이 만들고 공개한 모든 태그들을 둘러보고, 구독자 수와 등록된 음식점 수를 기준으로 정렬하여 유용한 태그를 찾아 구독할 수 있습니다.</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </main>
        </div>
    );
}
