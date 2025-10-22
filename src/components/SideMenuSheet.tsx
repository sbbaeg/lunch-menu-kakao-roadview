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
import { Menu } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SideMenuSheetProps {
    onShowFavorites: () => void;
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
}

export function SideMenuSheet({
    onShowFavorites,
    onShowBlacklist,
    onShowTagManagement,
}: SideMenuSheetProps) {
    const { data: session, status } = useSession();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
                            <Button variant="outline" onClick={() => signOut()} className="w-full mt-2">
                                로그아웃
                            </Button>
                        </div>
                    )}
                    {/* --- [수정된 부분 끝] --- */}
                    
                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        {/* ... (이하 즐겨찾기, 블랙리스트, 태그 버튼 등은 변경 없음) ... */}
                        <Button variant="ghost" className="justify-start" onClick={onShowFavorites}>
                            즐겨찾기 목록
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={onShowBlacklist}>
                            블랙리스트 관리
                        </Button>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="py-2 px-4 text-sm font-medium hover:no-underline hover:bg-accent rounded-md">태그</AccordionTrigger>
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

                        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                            {/* ... (도움말 Dialog 부분은 변경 없음) ... */}
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="justify-start">도움말 및 정보</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg flex flex-col h-[70vh] p-0">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle>사용 가이드</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground px-6">
                                    본 앱의 주요 기능과 사용법을 안내합니다.
                                </p>
                                <Tabs defaultValue="quickstart" className="w-full flex flex-col flex-1 min-h-0 pt-4" ref={scrollRef}>
                                    <TabsList className="grid w-full grid-cols-4 mx-6 w-auto">
                                        <TabsTrigger value="quickstart">기본 사용법</TabsTrigger>
                                        <TabsTrigger value="personal">개인화 기능</TabsTrigger>
                                        <TabsTrigger value="reviews">리뷰/별점</TabsTrigger>
                                        <TabsTrigger value="map">지도 기능</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="quickstart" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                                            <h4 className="font-semibold">기본 사용법</h4>
                                            <ul>
                                                <li><strong>필터:</strong> '필터' 기능은 음식 종류, 거리, 별점 등의 조건으로 검색 결과를 제한합니다.</li>
                                                <li><strong>검색:</strong> '검색' 기능은 설정된 필터 조건에 맞는 음식점 목록을 반환합니다.</li>
                                                <li><strong>룰렛:</strong> '룰렛' 기능은 검색된 결과 내에서 무작위로 하나의 음식점을 선택하여 제시합니다.</li>
                                                <li><strong>결과:</strong> 검색 결과는 지도와 목록에 동시 출력되며, 목록의 항목 선택 시 지도에서 해당 위치를 표시합니다.</li>
                                            </ul>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="personal" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                                            <h4 className="font-semibold">개인화 기능</h4>
                                            <ul>
                                                <li><strong>♥ 즐겨찾기:</strong> 특정 음식점을 즐겨찾기에 추가하여 관리할 수 있습니다. 즐겨찾기 목록은 사이드 메뉴에서 접근 가능합니다.</li>
                                                <li><strong>👁️ 블랙리스트:</strong> 특정 음식점을 블랙리스트에 추가할 수 있습니다. 블랙리스트에 추가된 음식점은 모든 검색 결과에서 제외됩니다.</li>
                                                <li><strong>🏷️ 태그:</strong> 사용자는 직접 태그를 생성하여 음식점을 분류하고 관리할 수 있습니다. 태그는 뱃지(Badge) 형태로 표시되며, 아이콘과 스타일로 종류를 구분할 수 있습니다.
                                                    <ul>
                                                        <li><strong>★ 구독 태그:</strong> 다른 사용자의 유용한 공개 태그를 구독한 경우, 별 아이콘과 함께 강조 표시됩니다.</li>
                                                        <li><strong># 내 태그:</strong> 내가 직접 생성한 태그는 테두리 스타일로 표시됩니다.</li>
                                                        <li><strong># 기타 공개 태그:</strong> 다른 사용자가 생성한 공개 태그는 회색 배경으로 표시됩니다.</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="reviews" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                                            <h4 className="font-semibold">리뷰 및 평점</h4>
                                            <ul>
                                                <li><strong>평점 시스템:</strong> 본 앱은 두 종류의 평점 정보를 제공합니다. 구글(Google)에 등록된 평점과 본 앱 사용자(User)가 직접 기록한 평점이 함께 표시됩니다.</li>
                                                <li><strong>리뷰 기능:</strong> 각 음식점의 상세 페이지에서 해당 음식점에 대한 사용자 리뷰를 조회하고 작성할 수 있습니다.</li>
                                                <li><strong>베스트 리뷰:</strong> 다른 사용자에게 '추천'을 많이 받은 리뷰는 '베스트 리뷰'로 선정되어, 정렬 순서와 관계없이 항상 리뷰 목록 최상단에 노출됩니다.</li>
                                            </ul>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="map" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                                            <h4 className="font-semibold">지도 기능</h4>
                                            <ul>
                                                <li><strong>지도 영역 검색:</strong> 지도를 이동하면 '현 지도에서 검색' 버튼이 활성화됩니다. 이 버튼을 사용하면 현재 보이는 지도 영역 내에서 다시 검색을 수행합니다.</li>
                                                <li><strong>검색 모드 전환:</strong> 지도 상단 검색창 옆의 스위치를 사용하여 '장소' 또는 '음식점' 검색 모드를 선택할 수 있습니다.
                                                    <ul>
                                                        <li><strong>장소 검색:</strong> '장소' 모드에서는 '강남역'과 같이 특정 지역이나 장소 이름으로 검색하여 지도를 해당 위치로 이동시킬 수 있습니다.</li>
                                                        <li><strong>음식점 검색:</strong> '음식점' 모드에서는 '마라탕'과 같이 원하는 메뉴나 식당 이름으로 검색하여 현재 지도 영역 내의 관련 음식점을 찾을 수 있습니다.</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </TabsContent>
                                </Tabs>
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
    );
}
