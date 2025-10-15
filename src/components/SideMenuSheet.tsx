// components/SideMenuSheet.tsx (새 파일)

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
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
import { useState } from "react";
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

    return (
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
                    {/* 로딩 중 */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-2 p-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}

                    {/* 비로그인 상태 */}
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

                    {/* 로그인 상태 */}
                    {status === 'authenticated' && session?.user && (
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
                    <Separator className="my-4" />

                    <div className="flex flex-col gap-2 px-4">
                        <Button variant="ghost" className="justify-start" onClick={onShowFavorites}>
                            즐겨찾기 목록
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={onShowBlacklist}>
                            블랙리스트 관리
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={onShowTagManagement}>
                            태그 관리
                        </Button>

                        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="justify-start">도움말 및 정보</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>도움말 및 정보</DialogTitle></DialogHeader>
                                <div className="py-4 space-y-4 text-sm">
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>🧭 '오늘 뭐 먹지?' 완벽 가이드</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-2">
                                            <p className="text-sm text-muted-foreground mb-4">
                                                안녕하세요! 이 앱은 여러분의 점심 고민을 해결해드리기 위해 만들어졌어요. 아래 가이드를 보고 100% 활용해보세요!
                                            </p>
                                            <Tabs defaultValue="quickstart" className="w-full">
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="quickstart">간단 사용법</TabsTrigger>
                                                    <TabsTrigger value="personal">개인화 기능</TabsTrigger>
                                                    <TabsTrigger value="map">지도 활용</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="quickstart" className="py-4 px-1 space-y-4">
                                                    <h3 className="font-semibold text-lg">🚀 30초 완성! 빠른 시작 가이드</h3>
                                                    <div className="text-muted-foreground space-y-3">
                                                        <p>1. 가장 먼저 **[검색]** 버튼을 눌러 내 주변에 있는 맛집 목록을 확인하세요.</p>
                                                        <p>2. 선택이 어렵다면 **[룰렛]** 버튼으로 오늘의 점심 메뉴를 운명에 맡겨보세요!</p>
                                                        <p>3. 한식이 끌리나요? **[필터]**를 열어 원하는 음식 종류, 거리, 별점 등을 설정해 선택지를 좁힐 수 있습니다.</p>
                                                        <p>4. 마음에 드는 가게는 카드 안의 하트(❤️)를 눌러 **[즐겨찾기]**에 저장해두세요. 나중에 다시 보기 편해요.</p>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="personal" className="py-4 px-1 space-y-4">
                                                    <h3 className="font-semibold text-lg">✍️ 나만의 맛집 지도 만들기</h3>
                                                    <div className="space-y-4 text-muted-foreground">
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">즐겨찾기 (❤️)</h4>
                                                            <p>마음에 드는 가게를 즐겨찾기에 추가하면, 나중에 사이드 메뉴의 **[즐겨찾기 목록]**에서 모아볼 수 있습니다.<br/><strong>꿀팁:</strong> 필터에서 '즐겨찾기에서만 검색'을 켜면 내가 좋아하는 가게들 중에서만 검색하거나 룰렛을 돌릴 수 있어요!</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">블랙리스트 (👁️‍🗨️)</h4>
                                                            <p>다시는 보고 싶지 않은 가게가 있다면, 카드 안의 눈 모양 버튼을 눌러 블랙리스트에 추가하세요. 검색 결과에서 깔끔하게 사라집니다. 관리는 사이드 메뉴의 **[블랙리스트 관리]**에서 할 수 있습니다.</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">태그 (#)</h4>
                                                            <p>태그는 맛집을 나만의 기준으로 분류하는 가장 강력한 방법입니다. 카드 안의 태그(🏷️) 버튼을 눌러 `#혼밥하기좋은`, `#분위기깡패`처럼 자유롭게 태그를 만들고 붙여보세요.<br/>태그는 세 종류가 있어요.</p>
                                                            <ul className="list-['-_'] list-inside ml-4 mt-2 space-y-2">
                                                                <li><Badge variant="outline" className="mr-1 cursor-default">#내 태그</Badge> : 내가 직접 만든 태그입니다.</li>
                                                                <li><Badge variant="default" className="mr-1 cursor-default">★ 구독 태그</Badge> : 다른 사람이 만든 태그를 구독한 것입니다.</li>
                                                                <li><Badge variant="secondary" className="mr-1 cursor-default"># 공개 태그</Badge> : 다른 사용자가 공개한 태그입니다.</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="map" className="py-4 px-1 space-y-4">
                                                    <h3 className="font-semibold text-lg">🗺️ 지도 100% 활용하기</h3>
                                                    <div className="space-y-4 text-muted-foreground">
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">원격 탐색 (다른 동네 맛집 찾기)</h4>
                                                            <p>지도 위 검색창에 '성수동'이나 '홍대입구역'처럼 가고 싶은 동네나 역 이름을 검색해보세요. 지도가 그 위치로 즉시 이동하여 탐색을 시작할 수 있습니다.</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">현지 탐색 (지도 중심으로 검색)</h4>
                                                            <p>지도를 손으로 끌어 원하는 위치로 옮긴 후, **[이 지역에서 재검색]** 버튼을 눌러보세요. 현재 보이는 지도 중앙을 기준으로 맛집을 다시 찾아줍니다.</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-1">미리보기 (골목길까지 확인)</h4>
                                                            <p>가게 카드를 선택하면 나타나는 **[로드뷰 보기]** 버튼을 눌러보세요. 가게의 실제 외관이나 주변 분위기를 미리 확인할 수 있어 실패 확률을 줄여줍니다.</p>
                                                        </div>
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    </DialogContent>
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
    );
}