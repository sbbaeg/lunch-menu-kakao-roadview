"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tag } from "@/lib/types";

// --- 상수 정의 ---
const CATEGORIES = [
  { value: "korean_restaurant", label: "한식" },
  { value: "japanese_restaurant", label: "일식" },
  { value: "chinese_restaurant", label: "중식" },
  { value: "american_restaurant", label: "양식" },
  { value: "italian_restaurant", label: "이탈리안" },
  { value: "cafe", label: "카페" },
  { value: "bar", label: "주점" },
  { value: "bakery", label: "베이커리" },
  { value: "fast_food_restaurant", label: "패스트푸드" },
  { value: "pizza_restaurant", label: "피자" },
  { value: "chicken_restaurant", label: "치킨" },
  { value: "buffet", label: "뷔페" },
];
const DISTANCES = [
  { value: "500", label: "가까워요", walkTime: "약 5분" },
  { value: "800", label: "적당해요", walkTime: "약 10분" },
  { value: "2000", label: "조금 멀어요", walkTime: "약 25분" },
];

// --- 타입 정의 ---
export interface FilterState {
  categories: string[];
  distance: string;
  sortOrder: "accuracy" | "distance" | "rating";
  resultCount: number;
  minRating: number;
  searchInFavoritesOnly: boolean;
  openNowOnly: boolean;
  includeUnknownHours: boolean;
  tags: number[];
  allowsDogsOnly: boolean;
  hasParkingOnly: boolean;
  wheelchairAccessibleEntrance: boolean;
  wheelchairAccessibleRestroom: boolean;
  wheelchairAccessibleSeating: boolean;
  wheelchairAccessibleParking: boolean;
}

interface FilterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialFilters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  userTags: Tag[];
}

export function FilterDialog({
  isOpen,
  onOpenChange,
  initialFilters,
  onApplyFilters,
  userTags,
}: FilterDialogProps) {
  // page.tsx에 있던 temp... 상태들을 모두 가져옵니다.
  const [tempSelectedCategories, setTempSelectedCategories] = useState(initialFilters.categories);
  const [tempSelectedDistance, setTempSelectedDistance] = useState(initialFilters.distance);
  const [tempSortOrder, setTempSortOrder] = useState(initialFilters.sortOrder);
  const [tempResultCount, setTempResultCount] = useState(initialFilters.resultCount);
  const [tempMinRating, setTempMinRating] = useState(initialFilters.minRating);
  const [tempSearchInFavoritesOnly, setTempSearchInFavoritesOnly] = useState(initialFilters.searchInFavoritesOnly);
  const [tempOpenNowOnly, setTempOpenNowOnly] = useState(initialFilters.openNowOnly);
  const [tempIncludeUnknownHours, setTempIncludeUnknownHours] = useState(initialFilters.includeUnknownHours);
  const [tempSelectedTags, setTempSelectedTags] = useState(initialFilters.tags);
  const [tempAllowsDogsOnly, setTempAllowsDogsOnly] = useState(initialFilters.allowsDogsOnly);
  const [tempHasParkingOnly, setTempHasParkingOnly] = useState(initialFilters.hasParkingOnly);
  const [tempWheelchairAccessibleEntrance, setTempWheelchairAccessibleEntrance] = useState(initialFilters.wheelchairAccessibleEntrance);
  const [tempWheelchairAccessibleRestroom, setTempWheelchairAccessibleRestroom] = useState(initialFilters.wheelchairAccessibleRestroom);
  const [tempWheelchairAccessibleSeating, setTempWheelchairAccessibleSeating] = useState(initialFilters.wheelchairAccessibleSeating);
  const [tempWheelchairAccessibleParking, setTempWheelchairAccessibleParking] = useState(initialFilters.wheelchairAccessibleParking);

  // 다이얼로그가 열릴 때마다 page.tsx의 현재 필터 값으로 상태를 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      setTempSelectedCategories(initialFilters.categories);
      setTempSelectedDistance(initialFilters.distance);
      setTempSortOrder(initialFilters.sortOrder);
      setTempResultCount(initialFilters.resultCount);
      setTempMinRating(initialFilters.minRating);
      setTempSearchInFavoritesOnly(initialFilters.searchInFavoritesOnly);
      setTempOpenNowOnly(initialFilters.openNowOnly);
      setTempIncludeUnknownHours(initialFilters.includeUnknownHours);
      setTempSelectedTags(initialFilters.tags);
      setTempAllowsDogsOnly(initialFilters.allowsDogsOnly);
      setTempHasParkingOnly(initialFilters.hasParkingOnly);
      setTempWheelchairAccessibleEntrance(initialFilters.wheelchairAccessibleEntrance);
      setTempWheelchairAccessibleRestroom(initialFilters.wheelchairAccessibleRestroom);
      setTempWheelchairAccessibleSeating(initialFilters.wheelchairAccessibleSeating);
      setTempWheelchairAccessibleParking(initialFilters.wheelchairAccessibleParking);
    }
  }, [isOpen, initialFilters]);

  // 다이얼로그 내부에서만 사용되던 핸들러 함수들
  const handleTempCategoryChange = (categoryValue: string) => {
    setTempSelectedCategories((prev) =>
      prev.includes(categoryValue)
        ? prev.filter((c) => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const handleTempSelectAll = (checked: boolean | "indeterminate") => {
    setTempSelectedCategories(checked === true ? CATEGORIES.map(c => c.value) : []);
  };
  
  const handleTempTagChange = (tagId: number) => {
    setTempSelectedTags(prev =>
        prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // '완료' 버튼 클릭 시, 부모 컴포넌트(page.tsx)로 변경된 필터 값들을 전달합니다.
  const handleApply = () => {
    onApplyFilters({
      categories: tempSelectedCategories,
      distance: tempSelectedDistance,
      sortOrder: tempSortOrder,
      resultCount: tempResultCount,
      minRating: tempMinRating,
      searchInFavoritesOnly: tempSearchInFavoritesOnly,
      openNowOnly: tempOpenNowOnly,
      includeUnknownHours: tempIncludeUnknownHours,
      tags: tempSelectedTags,
      allowsDogsOnly: tempAllowsDogsOnly,
      hasParkingOnly: tempHasParkingOnly,
      wheelchairAccessibleEntrance: tempWheelchairAccessibleEntrance,
      wheelchairAccessibleRestroom: tempWheelchairAccessibleRestroom,
      wheelchairAccessibleSeating: tempWheelchairAccessibleSeating,
      wheelchairAccessibleParking: tempWheelchairAccessibleParking,
    });
    onOpenChange(false); // 다이얼로그 닫기
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>검색 필터 설정</DialogTitle>
        </DialogHeader>
        {/* page.tsx에서 잘라낸 JSX를 그대로 사용합니다. */}
        <div className="py-4 space-y-4 dark:text-foreground overflow-y-auto pr-4 flex-1">
            {/* ... (이하 필터 다이얼로그 JSX 전체) ... */}
            <div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="temp-favorites-only" checked={tempSearchInFavoritesOnly} onCheckedChange={(checked) => setTempSearchInFavoritesOnly(Boolean(checked))} />
                    <Label htmlFor="temp-favorites-only" className="font-semibold text-lg cursor-pointer">즐겨찾기에서만 검색</Label>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="temp-open-now" checked={tempOpenNowOnly} onCheckedChange={(checked) => setTempOpenNowOnly(Boolean(checked))} />
                    <Label htmlFor="temp-open-now" className="font-semibold text-lg cursor-pointer">영업 중인 가게만 보기</Label>
                </div>
                <div className="flex items-center space-x-2 pl-6">
                    <Checkbox id="temp-include-unknown" checked={tempIncludeUnknownHours} onCheckedChange={(checked) => setTempIncludeUnknownHours(Boolean(checked))} disabled={!tempOpenNowOnly} />
                    <Label htmlFor="temp-include-unknown" className={tempOpenNowOnly ? "cursor-pointer" : "text-gray-400 dark:text-gray-500"}>영업 정보 없는 가게 포함</Label>
                </div>
            </div>
            <div className="space-y-4">
                <Label className="text-lg font-semibold">편의 시설</Label>
                <div className="space-y-2 pl-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="temp-allows-dogs" checked={tempAllowsDogsOnly} onCheckedChange={(checked) => setTempAllowsDogsOnly(Boolean(checked))} />
                        <Label htmlFor="temp-allows-dogs" className="cursor-pointer">반려견 동반 가능</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="temp-has-parking" checked={tempHasParkingOnly} onCheckedChange={(checked) => setTempHasParkingOnly(Boolean(checked))} />
                        <Label htmlFor="temp-has-parking" className="cursor-pointer">주차 가능</Label>
                    </div>
                    <div className="space-y-2 pt-2">
                        <Label className="font-semibold">휠체어 접근성</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="temp-wc-entrance" checked={tempWheelchairAccessibleEntrance} onCheckedChange={(checked) => setTempWheelchairAccessibleEntrance(Boolean(checked))} />
                                <Label htmlFor="temp-wc-entrance" className="cursor-pointer">휠체어 접근 가능 입구</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="temp-wc-restroom" checked={tempWheelchairAccessibleRestroom} onCheckedChange={(checked) => setTempWheelchairAccessibleRestroom(Boolean(checked))} />
                                <Label htmlFor="temp-wc-restroom" className="cursor-pointer">휠체어 사용 가능 화장실</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="temp-wc-seating" checked={tempWheelchairAccessibleSeating} onCheckedChange={(checked) => setTempWheelchairAccessibleSeating(Boolean(checked))} />
                                <Label htmlFor="temp-wc-seating" className="cursor-pointer">휠체어 사용 가능 좌석</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="temp-wc-parking" checked={tempWheelchairAccessibleParking} onCheckedChange={(checked) => setTempWheelchairAccessibleParking(Boolean(checked))} />
                                <Label htmlFor="temp-wc-parking" className="cursor-pointer">휠체어 전용 주차장</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label className="text-lg font-semibold">음식 종류</Label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    {CATEGORIES.map((category) => (
                        <div key={category.value} className="flex items-center space-x-2">
                            <Checkbox id={`temp-${category.value}`} checked={tempSelectedCategories.includes(category.value)} onCheckedChange={() => handleTempCategoryChange(category.value)} />
                            <Label htmlFor={`temp-${category.value}`}>{category.label}</Label>
                        </div>
                    ))}
                </div>
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                    <Checkbox id="temp-select-all" checked={tempSelectedCategories.length === CATEGORIES.length} onCheckedChange={(checked) => handleTempSelectAll(checked)} />
                    <Label htmlFor="temp-select-all" className="font-semibold">모두 선택</Label>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label className="text-lg font-semibold">태그로 필터링</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {userTags.length > 0 ? (
                        userTags.map((tag) => (
                            <div key={tag.id} onClick={() => handleTempTagChange(tag.id)} className={`cursor-pointer rounded-full px-3 py-1 text-sm transition-colors ${tempSelectedTags.includes(tag.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {tag.name}
                            </div>
                        ))
                    ) : ( <p className="text-sm text-muted-foreground">생성된 태그가 없습니다.</p> )}
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label className="text-lg font-semibold">검색 반경</Label>
                <RadioGroup value={tempSelectedDistance} onValueChange={setTempSelectedDistance} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    {DISTANCES.map((dist) => (
                        <div key={dist.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={dist.value} id={`temp-${dist.value}`} />
                            <Label htmlFor={`temp-${dist.value}`} className="cursor-pointer">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{dist.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{`(${dist.value}m ${dist.walkTime})`}</span>
                                </div>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label className="text-lg font-semibold">정렬 방식</Label>
                <RadioGroup value={tempSortOrder} onValueChange={(value) => setTempSortOrder(value as "accuracy" | "distance" | "rating")} className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="accuracy" id="temp-sort-accuracy" /><Label htmlFor="temp-sort-accuracy">랜덤 추천</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="distance" id="temp-sort-distance" /><Label htmlFor="temp-sort-distance">가까운 순</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="rating" id="temp-sort-rating" /><Label htmlFor="temp-sort-rating">별점 순</Label></div>
                </RadioGroup>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label htmlFor="temp-min-rating" className="text-lg font-semibold">최소 별점: {tempMinRating.toFixed(1)}점 이상</Label>
                <Slider id="temp-min-rating" value={[tempMinRating]} onValueChange={(value) => setTempMinRating(value[0])} min={0} max={5} step={0.1} className="mt-2" />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div>
                <Label htmlFor="temp-result-count" className="text-lg font-semibold">검색 개수: {tempResultCount}개</Label>
                <Slider id="temp-result-count" value={[tempResultCount]} onValueChange={(value) => setTempResultCount(value[0])} min={5} max={15} step={1} className="mt-2" />
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleApply}>완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}