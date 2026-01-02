'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
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
import { Heart, EyeOff, Tags, FileText, ThumbsUp, Trophy, Bell, MessageSquare, HelpCircle, Shield, Cog } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAppStore } from "@/store/useAppStore";
import { useNotifications } from "@/hooks/useNotifications";
import BadgeDisplay from "@/components/BadgeDisplay";
import BadgeManagementDialog from "@/components/BadgeManagementDialog";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { HelpDialog } from "@/components/HelpDialog";

interface MyPageProps {
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
    onShowRanking: () => void;
    onShowNotifications: () => void;
}

export default function MyPage({ 
    onShowBlacklist,
    onShowTagManagement,
    onShowRanking,
    onShowNotifications,
}: MyPageProps) {
    const { data: session, status } = useSession();
    const showFavoritesPage = useAppStore((state) => state.showFavoritesPage);
    const showLikedRestaurantsPage = useAppStore((state) => state.showLikedRestaurantsPage);
    const showTagExplore = useAppStore((state) => state.showTagExplore);
    const showMyReviews = useAppStore((state) => state.showMyReviews);
    const showSettingsPage = useAppStore((state) => state.showSettingsPage);
    const { unreadCount } = useNotifications();
    const isBadgeManagementOpen = useAppStore((state) => state.isBadgeManagementOpen);
    const setIsBadgeManagementOpen = useAppStore((state) => state.setIsBadgeManagementOpen);
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
                    <BadgeDisplay userId={session.user.id} key={badgeDisplayKey} />
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
            <main className="flex-1 overflow-y-auto p-2 min-h-0 bg-background">
                <div className="py-4">
                    {renderAuthSection()}
                    
                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        <h3 className="text-lg font-semibold mb-2">내 활동 관리</h3>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showFavoritesPage}>
                            <Heart className="mr-2 h-4 w-4" /> 즐겨찾기 목록
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showLikedRestaurantsPage}>
                            <ThumbsUp className="mr-2 h-4 w-4" /> 좋아요한 음식점
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showMyReviews}>
                            <FileText className="mr-2 h-4 w-4" /> 내 리뷰
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={onShowBlacklist}>
                            <EyeOff className="mr-2 h-4 w-4" /> 블랙리스트 관리
                        </Button>
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={() => setIsBadgeManagementOpen(true)}>
                            <Trophy className="mr-2 h-4 w-4" /> 내 뱃지 관리
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
                        <Button variant="ghost" className="justify-start w-full p-2" onClick={showSettingsPage}>
                            <Cog className="mr-2 h-4 w-4" /> 설정
                        </Button>
                    </div>

                    {isMounted && session?.user?.isAdmin && (
                        <>
                            <Separator className="my-4" />
                            <div className="px-4">
                                <h3 className="text-lg font-semibold mb-2">관리</h3>
                                <Button variant="ghost" className="justify-start w-full p-2" asChild>
                                    <a href="/admin">
                                        <Shield className="mr-2 h-4 w-4" />
                                        관리자 페이지
                                    </a>
                                </Button>
                            </div>
                        </>
                    )}

import { NotificationCountBadge } from "@/components/ui/NotificationCountBadge";

...

                    {status === 'authenticated' && (
                        <>
                            <Separator className="my-4" />
                            <div className="px-4">
                                <h3 className="text-lg font-semibold mb-2">지원</h3>
                                <NotificationsDialog>
                                    <Button variant="ghost" className="relative justify-start w-full p-2">
                                        <Bell className="mr-2 h-4 w-4" /> 알림 및 문의
                                        <NotificationCountBadge count={unreadCount} />
                                    </Button>
                                </NotificationsDialog>
                            </div>
                        </>
                    )}
                    
                    <Separator className="my-4" />

                     <div className="px-4">
                        <HelpDialog />
                    </div>
                </div>
            </main>
            <BadgeManagementDialog isOpen={isBadgeManagementOpen} onOpenChange={handleBadgeManagementOpenChange} />
        </div>
    );
}
