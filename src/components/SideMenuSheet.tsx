// components/SideMenuSheet.tsx (새 파일)

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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
import { Menu, Heart, EyeOff, Tags, FileText } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgeManagementDialog from "@/components/BadgeManagementDialog";
import BadgeDisplay from "@/components/BadgeDisplay";
import { ContactAdminDialog } from "@/components/ContactAdminDialog";

interface SideMenuSheetProps {
    onShowFavorites: () => void;
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
    onShowMyReviews: () => void;
    onShowLikedRestaurants?: () => void; // 1. Prop 선택적으로 변경
}

export function SideMenuSheet({
    onShowFavorites,
    onShowBlacklist,
    onShowTagManagement,
    onShowMyReviews,
    onShowLikedRestaurants, // 2. Prop 받기
}: SideMenuSheetProps) {
    const { data: session, status } = useSession();
    const [isBadgeManagementOpen, setIsBadgeManagementOpen] = useState(false);
    const [badgeDisplayKey, setBadgeDisplayKey] = useState(0);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleBadgeManagementOpenChange = (isOpen: boolean) => {
        setIsBadgeManagementOpen(isOpen);
        if (!isOpen) {
            setBadgeDisplayKey(prev => prev + 1);
        }
    };

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
    }, [isHelpOpen]); // 도움말이 열릴 때마다 이벤트 리스너를 설정합니다.


    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="h-11 w-11">
                    <Menu style={{ width: '38px', height: '38px' }} />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    {/* --- [수정된 부분 시작] --- */}

                    {/* 3. [추가] 마운트 전(!isMounted)에는 무조건 스켈레톤을 렌더링합니다. (서버와 동일한 화면) */}
                    {!isMounted && (
                        <div className="flex flex-col items-center gap-2 p-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}

                    {/* 4. [수정] 'isMounted &&' 조건을 모든 status 블록에 추가합니다. */}
                    
                    {/* 로딩 중 (마운트된 후) */}
                    {isMounted && status === 'loading' && (
                        <div className="flex flex-col items-center gap-2 p-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}

                    {/* 비로그인 상태 (마운트된 후) */}
                    {isMounted && status === 'unauthenticated' && (
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
                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">또는</span></div>
                                    </div>
                                    <div className="grid gap-4">
                                        <Button variant="secondary" onClick={() => signIn('google', undefined, { prompt: 'select_account' })} className="w-full h-12 text-lg">
                                            다른 Google 계정 사용
                                        </Button>
                                        <Button variant="secondary" onClick={() => signIn('kakao', undefined, { prompt: 'select_account' })} className="w-full h-12 text-lg">
                                            다른 Kakao 계정 사용
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* 로그인 상태 (마운트된 후) */}
                    {isMounted && status === 'authenticated' && session?.user && (
                        <div className="flex flex-col items-center gap-2 p-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="mt-2 font-semibold">{session.user.name}</p>
                            <BadgeDisplay userId={session.user.id} key={badgeDisplayKey} />
                            <Button variant="outline" onClick={() => signOut()} className="w-full mt-2">
                                로그아웃
                            </Button>
                        </div>
                    )}
                    {/* --- [수정된 부분 끝] --- */}
                    
                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        <Button variant="ghost" className="justify-start" onClick={onShowFavorites}>
                            즐겨찾기 목록
                        </Button>
                        {/* 3. 버튼 조건부 렌더링 */}
                        {onShowLikedRestaurants && (
                            <Button variant="ghost" className="justify-start" onClick={onShowLikedRestaurants}>
                                좋아요한 음식점
                            </Button>
                        )}
                        <Button variant="ghost" className="justify-start" onClick={onShowMyReviews}>
                            내 리뷰
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={onShowBlacklist}>
                            블랙리스트 관리
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={() => setIsBadgeManagementOpen(true)}>
                            내 뱃지 관리
                        </Button>
                        <Link href="/ranking" passHref>
                            <Button variant="ghost" className="justify-start w-full">음식점 랭킹</Button>
                        </Link>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="flex w-full p-2 text-sm font-medium hover:no-underline hover:bg-accent rounded-md" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
                                    태그
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                    <div className="flex flex-col pl-4 pt-2">
                                        <Button variant="ghost" className="justify-start w-full" onClick={onShowTagManagement}>- 태그 관리</Button>
                                        <Link href="/tags/explore" passHref>
                                            <Button variant="ghost" className="justify-start w-full">- 태그 탐색</Button>
                                        </Link>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <Separator className="my-4" />

                    {isMounted && status === 'authenticated' && (
                        <div className="px-4 mb-4">
                            <ContactAdminDialog>
                                <Button variant="ghost" className="justify-start w-full">관리자에게 문의</Button>
                            </ContactAdminDialog>
                        </div>
                    )}

                    <div className="px-4 flex items-center justify-between">
                        <span className="text-sm font-medium">테마 변경</span>
                        <ThemeToggle />
                    </div>

                    <div className="px-4 mt-4">
                                                <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="justify-start w-full">도움말 및 정보</Button>
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
                                        <TabsTrigger value="notifications">알림</TabsTrigger>
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

                                    <TabsContent value="notifications" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">알림 종류</h4>
                                                <p className="text-sm text-muted-foreground">계정 상태 변경(차단/해제) 또는 구독 중인 태그에 새로운 장소가 추가될 경우 알림을 받게 됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">읽음 처리</h4>
                                                <p className="text-sm text-muted-foreground">알림 아이콘을 클릭하여 목록을 열면, 읽지 않은 모든 알림은 자동으로 '읽음' 상태로 변경됩니다.</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <h4 className="font-semibold mb-2">알림 삭제</h4>
                                                <p className="text-sm text-muted-foreground">개별 알림 옆의 'X' 버튼을 눌러 특정 알림만 삭제하거나, 목록 하단의 '읽은 알림 모두 삭제' 버튼으로 읽은 알림들을 한 번에 정리할 수 있습니다.</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog> 
                    </div>
                </div>
            </SheetContent>
                    <BadgeManagementDialog isOpen={isBadgeManagementOpen} onOpenChange={handleBadgeManagementOpenChange} />
        </Sheet>
    );
}