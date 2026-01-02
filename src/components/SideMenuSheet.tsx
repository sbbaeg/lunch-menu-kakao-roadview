"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
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
import Link from "next/link";
import { Menu, Heart, EyeOff, Tags, FileText, HelpCircle, Shield } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgeManagementDialog from "@/components/BadgeManagementDialog";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { HelpDialog } from "@/components/HelpDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAppStore } from "@/store/useAppStore";
import { NotificationCountBadge } from "@/components/ui/NotificationCountBadge";

interface SideMenuSheetProps {
    onShowFavorites: () => void;
    onShowBlacklist: () => void;
    onShowTagManagement: () => void;
    onShowMyReviews: () => void;
    onShowLikedRestaurants?: () => void;
}

export function SideMenuSheet({
    onShowFavorites,
    onShowBlacklist,
    onShowTagManagement,
    onShowMyReviews,
    onShowLikedRestaurants,
}: SideMenuSheetProps) {
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
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
                <div className="py-4 h-full overflow-y-auto">
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

                    {isMounted && session?.user?.isAdmin && (
                        <>
                            <Separator className="my-4" />
                            <div className="px-4">
                                <Link href="/admin" passHref>
                                    <Button variant="secondary" className="w-full justify-start">
                                        <Shield className="mr-2 h-4 w-4" />
                                        관리자 페이지
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                    
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

import { NotificationCountBadge } from "@/components/ui/NotificationCountBadge";

...

                    {isMounted && status === 'authenticated' && (
                        <div className="px-4 mb-4">
                            <NotificationsDialog>
                                <Button variant="ghost" className="relative justify-start w-full flex items-center">
                                    <span>알림 및 문의</span>
                                    <NotificationCountBadge count={unreadCount} />
                                </Button>
                            </NotificationsDialog>
                        </div>
                    )}

                    <div className="px-4">
                        <SettingsDialog>
                            <Button variant="ghost" className="justify-start w-full">
                                설정
                            </Button>
                        </SettingsDialog>
                    </div>



                    <div className="px-4 mt-4">
                        <HelpDialog />
                    </div>
                </div>
            </SheetContent>
                    <BadgeManagementDialog isOpen={isBadgeManagementOpen} onOpenChange={handleBadgeManagementOpenChange} />
        </Sheet>
    );
}