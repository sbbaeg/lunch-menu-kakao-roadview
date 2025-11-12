"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Dog, ParkingSquare, Accessibility } from "lucide-react";

export function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="justify-start w-full p-2">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    도움말 및 정보
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg flex flex-col h-[85vh] p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>사용 가이드</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground px-6">
                    본 앱의 주요 기능과 사용법을 안내합니다.
                </p>
                <Tabs defaultValue="quickstart" className="w-full flex flex-col flex-1 min-h-0 pt-4">
                    <TabsList className="grid w-full grid-cols-8 mx-6 w-auto">
                        <TabsTrigger value="quickstart">기본</TabsTrigger>
                        <TabsTrigger value="map">지도</TabsTrigger>
                        <TabsTrigger value="personal">개인화</TabsTrigger>
                        <TabsTrigger value="reviews">리뷰/평가</TabsTrigger>
                        <TabsTrigger value="explore">탐색</TabsTrigger>
                        <TabsTrigger value="inquiries">문의</TabsTrigger>
                        <TabsTrigger value="notifications">알림</TabsTrigger>
                        <TabsTrigger value="icons">아이콘</TabsTrigger>
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

                    <TabsContent value="inquiries" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">문의 작성 및 확인</h4>
                                <p className="text-sm text-muted-foreground">'지원' 섹션의 '문의' 버튼을 통해 앱 사용 중 발생하는 문제나 건의사항을 관리자에게 보낼 수 있습니다. 관리자가 답변을 등록하면 내역에서 확인할 수 있습니다.</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">답변 알림</h4>
                                <p className="text-sm text-muted-foreground">관리자가 내 문의에 답변을 등록하면 '문의' 버튼과 해당 문의 항목에 빨간 점이 표시되어 새로운 답변이 있음을 알려줍니다.</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">문의 관리</h4>
                                <p className="text-sm text-muted-foreground">문의 내역 목록은 '전체', '미응답', '답변완료' 탭으로 나누어 관리할 수 있으며, 각 문의 항목 옆의 휴지통 아이콘을 눌러 개별적으로 삭제할 수 있습니다.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">알림 종류</h4>
                                <p className="text-sm text-muted-foreground">계정 상태 변경(차단/해제), 구독 중인 태그에 새로운 장소 추가, 또는 관리자 문의에 대한 답변이 등록될 경우 알림을 받게 됩니다.</p>
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
                    
                    <TabsContent value="icons" className="mt-4 p-6 pt-0 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold mb-2">편의시설 아이콘</h4>
                                <p className="text-sm text-muted-foreground mb-3">음식점 목록 및 상세 정보에 표시되는 아이콘들은 다음과 같은 편의시설 정보를 의미합니다. 이 정보는 Google Maps에 등록된 데이터를 기반으로 합니다.</p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3">
                                        <Dog className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">반려견 동반이 가능한 장소입니다.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <ParkingSquare className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">주차장이 마련되어 있습니다.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Accessibility className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm">휠체어 이용 가능 편의시설(주차장, 입구, 좌석, 화장실 등)이 하나 이상 마련되어 있습니다.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
