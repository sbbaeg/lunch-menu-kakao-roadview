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
import { Heart, EyeOff, Tags, FileText } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAppStore } from "@/store/useAppStore";

interface MyPageProps {
    onShowFavorites: () => void;
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
}

export default function MyPage({ 
    onShowFavorites,
    onShowBlacklist,
    onShowTagManagement,
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
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showMyReviews}>
                            <FileText className="mr-2 h-4 w-4" /> 내가 쓴 리뷰
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowBlacklist}>
                            <EyeOff className="mr-2 h-4 w-4" /> 블랙리스트 관리
                        </Button>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="flex w-full justify-start p-2 text-sm font-medium hover:no-underline hover:bg-accent rounded-md">
                                    <Tags className="mr-2 h-4 w-4" /> 태그
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
                                    <TabsList className="grid w-full grid-cols-4 mx-6 w-auto">
                                        <TabsTrigger value="quickstart">기본 사용법</TabsTrigger>
                                        <TabsTrigger value="personal">개인화 기능</TabsTrigger>
                                        <TabsTrigger value="reviews">리뷰/별점</TabsTrigger>
                                        <TabsTrigger value="map">지도 기능</TabsTrigger>
                                    </TabsList>
                                    {/* ... TabsContent for help ... */}
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </main>
        </div>
    );
}
