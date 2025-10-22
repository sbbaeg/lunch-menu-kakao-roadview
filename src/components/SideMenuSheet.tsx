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
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
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
                                    <DialogTitle>🧭 '오늘 뭐 먹지?' 완벽 가이드</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground px-6">
                                    안녕하세요! 이 앱은 여러분의 점심 고민을 해결해드리기 위해 만들어졌어요. 아래 가이드를 보고 100% 활용해보세요!
                                </p>
                                <Tabs defaultValue="quickstart" className="w-full flex flex-col flex-1 min-h-0 pt-4" ref={scrollRef}>
                                    <TabsList className="grid w-full grid-cols-4 mx-6 w-auto">
                                        <TabsTrigger value="quickstart">간단 사용법</TabsTrigger>
                                        <TabsTrigger value="personal">개인화 기능</TabsTrigger>
                                        <TabsTrigger value="reviews">리뷰/별점</TabsTrigger>
                                        <TabsTrigger value="map">지도 활용</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="quickstart" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        {/* ... (도움말 내용) ... */}
                                    </TabsContent>
                                    <TabsContent value="personal" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        {/* ... (도움말 내용) ... */}
                                    </TabsContent>
                                    <TabsContent value="reviews" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        {/* ... (도움말 내용) ... */}
                                    </TabsContent>
                                    <TabsContent value="map" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                                        {/* ... (도움말 내용) ... */}
                                    </TabsContent>
                                </Tabs>
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
    );
}
