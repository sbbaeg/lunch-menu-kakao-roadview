// src/lib/categories.ts

interface Category {
  value: string;
  label: string;
  children?: string[];
}

export const CATEGORIES: Category[] = [
  // 아시아 요리
  {
    value: 'korean_restaurant',
    label: '한식',
    children: ['korean_bbq_restaurant', 'korean_noodles_restaurant', 'korean_soup_restaurant']
  },
  { value: 'korean_bbq_restaurant', label: '고기/구이' },
  { value: 'korean_noodles_restaurant', label: '칼국수/수제비' },
  { value: 'korean_soup_restaurant', label: '국/탕/찌개' },

  // 일식
  {
    value: 'japanese_restaurant',
    label: '일식',
    children: ['sushi_restaurant', 'ramen_restaurant', 'japanese_curry_restaurant', 'tonkatsu_restaurant', 'udon_and_soba_restaurant']
  },
  { value: 'sushi_restaurant', label: '스시' },
  { value: 'ramen_restaurant', label: '라멘' },
  { value: 'japanese_curry_restaurant', label: '카레' },
  { value: 'tonkatsu_restaurant', label: '돈까스' },
  { value: 'udon_and_soba_restaurant', label: '우동/소바' },

  // 중식
  {
    value: 'chinese_restaurant',
    label: '중식',
    children: ['dim_sum_restaurant', 'sichuan_restaurant']
  },
  { value: 'dim_sum_restaurant', label: '딤섬' },
  { value: 'sichuan_restaurant', label: '사천요리' },

  // 양식
  {
    value: 'western_restaurant',
    label: '양식',
    children: ['italian_restaurant', 'french_restaurant', 'spanish_restaurant', 'steak_house', 'pizza_restaurant']
  },
  { value: 'italian_restaurant', label: '이탈리안' },
  { value: 'french_restaurant', label: '프렌치' },
  { value: 'spanish_restaurant', label: '스페인' },
  { value: 'steak_house', label: '스테이크' },

  // 기타 아시안
  {
    value: 'asian_restaurant',
    label: '아시안',
    children: ['thai_restaurant', 'vietnamese_restaurant', 'indian_restaurant']
  },
  { value: 'thai_restaurant', label: '태국' },
  { value: 'vietnamese_restaurant',label: '베트남' },
  { value: 'indian_restaurant', label: '인도' },

  // 패스트푸드 및 분식
  {
    value: 'fast_food_restaurant',
    label: '패스트푸드/분식',
    children: ['hamburger_restaurant', 'pizza_restaurant', 'korean_street_food_restaurant']
  },
  { value: 'hamburger_restaurant', label: '햄버거' },
  { value: 'pizza_restaurant', label: '피자' },
  { value: 'chicken_restaurant', label: '치킨' },
  { value: 'korean_street_food_restaurant', label: '분식' }, // 분식 추가

  // 카페 & 디저트
  { value: 'cafe', label: '카페/디저트', children: ['bakery', 'ice_cream_shop'] },
  { value: 'bakery', label: '베이커리' },
  { value: 'ice_cream_shop', label: '아이스크림' },
  
  // 주점
  {
    value: 'bar',
    label: '주점',
    children: ['pub', 'wine_bar']
  },
  { value: 'pub', label: '펍' },
  { value: 'wine_bar', label: '와인바' },

  // 기타
  { value: 'vegetarian_restaurant', label: '채식' },
  { value: 'buffet', label: '뷔페' },
  { value: 'restaurant', label: '음식점' },
];

// 필터 UI에 표시될 상위 카테고리 목록 (자식 카테고리는 제외)
export const MAIN_CATEGORIES = CATEGORIES.filter(c => 
    !CATEGORIES.some(parent => parent.children?.includes(c.value))
);

/**
 * 선택된 카테고리 목록을 받아서, 하위 카테고리까지 모두 포함된 확장된 목록을 반환합니다.
 * @param selectedTypes 사용자가 선택한 카테고리 value 배열
 * @returns 하위 카테고리가 모두 포함된 Set 객체
 */
export function getExpandedCategoryTypes(selectedTypes: string[]): Set<string> {
    const expandedTypes = new Set<string>(selectedTypes);
    
    selectedTypes.forEach(type => {
        const category = CATEGORIES.find(c => c.value === type);
        if (category?.children) {
            category.children.forEach(child => expandedTypes.add(child));
        }
    });
    
    return expandedTypes;
}

/**
 * 장소의 타입 배열을 받아서, 표시할 가장 적절한 카테고리 라벨을 찾습니다.
 * @param placeTypes Google Place의 types 배열
 * @returns 표시할 카테고리 라벨 문자열
 */
export function getDisplayCategoryLabel(placeTypes: string[] | undefined): string {
    if (!placeTypes || placeTypes.length === 0) return '음식점';

    // 우선순위가 높은(구체적인) 카테고리부터 확인
    for (const category of CATEGORIES) {
        if (placeTypes.includes(category.value)) {
            // 부모 카테고리가 있는 경우, 부모 카테고리의 라벨을 반환 (예: '피자' -> '패스트푸드')
            // 단, UI에 직접 표시되는 카테고리(MAIN_CATEGORIES)는 그대로 라벨을 사용
            const parent = CATEGORIES.find(p => p.children?.includes(category.value));
            const isMainCategory = MAIN_CATEGORIES.some(mc => mc.value === category.value);
            if (parent && !isMainCategory) {
                return parent.label;
            }
            return category.label;
        }
    }
    
    // 매칭되는 카테고리가 없으면 '음식점'으로 표시
    if (placeTypes.includes('restaurant')) {
        return '음식점';
    }

    return '기타'; // 그 외의 경우
}