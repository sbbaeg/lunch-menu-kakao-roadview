
import { create } from 'zustand';
import { AppRestaurant, RestaurantWithTags } from '@/lib/types';
import { FilterState } from '@/components/FilterDialog';

interface AppState {
  // State
  selectedItemId: string;
  restaurantList: AppRestaurant[];
  rouletteItems: AppRestaurant[];
  userLocation: { lat: number; lng: number } | null;
  activeTab: 'map' | 'favorites' | 'roulette' | 'my-page' | 'splash';

  // Filter State
  filters: Omit<FilterState, 'categories'> & { categories: string[] };

  displayedSortOrder: 'accuracy' | 'distance' | 'rating';
  blacklistExcludedCount: number;
  loading: boolean;
  isMapReady: boolean;
  isResultPanelExpanded: boolean;

  // Actions
  toggleResultPanel: () => void;
  setActiveTab: (tab: 'map' | 'favorites' | 'roulette' | 'my-page') => void;
  setSelectedItemId: (id: string) => void;
  setRestaurantList: (restaurants: AppRestaurant[]) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setFilters: (newFilters: Partial<AppState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setIsMapReady: (isMapReady: boolean) => void;
  
  clearMapAndResults: () => void;
  getNearbyRestaurants: (center: { lat: number; lng: number }, query?: string) => Promise<AppRestaurant[]>;
  recommendProcess: (isRoulette: boolean, center?: { lat: number; lng: number }) => Promise<{ success: boolean; message?: string; isRoulette?: boolean, restaurants?: AppRestaurant[] }>;
  handleSearchInArea: (center: { lat: number; lng: number }) => void;
  handleAddressSearch: (keyword: string, center: { lat: number; lng: number }) => void;
  handleRouletteResult: (winner: AppRestaurant) => void;
  handleTagsChange: (updatedRestaurant: AppRestaurant) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  selectedItemId: '',
  restaurantList: [],
  rouletteItems: [],
  userLocation: null,
  activeTab: 'splash',
  
  filters: {
    categories: [],
    distance: '800',
    sortOrder: 'accuracy',
    resultCount: 5,
    minRating: 4.0,
    searchInFavoritesOnly: false,
    openNowOnly: false,
    includeUnknownHours: true,
    tags: [],
  },

  displayedSortOrder: 'accuracy',
  blacklistExcludedCount: 0,
  loading: false,
  isMapReady: false,
  isResultPanelExpanded: false,

  // Actions
  toggleResultPanel: () => set((state) => ({ isResultPanelExpanded: !state.isResultPanelExpanded })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setRestaurantList: (restaurants) => set({ restaurantList: restaurants }),
  setUserLocation: (location) => set({ userLocation: location }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setLoading: (loading) => set({ loading }),
  setIsMapReady: (isMapReady) => set({ isMapReady }),

  clearMapAndResults: () => {
    set({ selectedItemId: '', restaurantList: [] });
  },

  getNearbyRestaurants: async (center, queryOverride) => {
    const { filters } = get();
    const query = queryOverride || (filters.categories.length > 0 ? filters.categories.join(',') : '음식점');
    
    let apiUrl = `/api/recommend?lat=${center.lat}&lng=${center.lng}&query=${encodeURIComponent(
      query
    )}&radius=${filters.distance}&sort=${filters.sortOrder}&size=${filters.resultCount}&minRating=${filters.minRating}&openNow=${filters.openNowOnly}&includeUnknown=${filters.includeUnknownHours}`;

    if (filters.tags.length > 0) {
      apiUrl += `&tags=${filters.tags.join(',')}`;
    }
    if (filters.searchInFavoritesOnly) {
      apiUrl += `&fromFavorites=true`;
    }
    apiUrl += `&_=${new Date().getTime()}`;

    const response = await fetch(apiUrl);
    const data: { documents?: RestaurantWithTags[], blacklistExcludedCount?: number } = await response.json();

    const formattedRestaurants: AppRestaurant[] = (data.documents || []).map(place => ({
        id: place.id,
        kakaoPlaceId: place.id,
        placeName: place.place_name,
        categoryName: place.category_name,
        address: place.road_address_name,
        x: place.x,
        y: place.y,
        placeUrl: place.place_url,
        distance: place.distance,
        googleDetails: place.googleDetails,
        tags: place.tags,
    }));

    set({ blacklistExcludedCount: data.blacklistExcludedCount || 0 });
    return formattedRestaurants;
  },

  recommendProcess: async (isRoulette, center) => {
    set({ loading: true, displayedSortOrder: get().filters.sortOrder, blacklistExcludedCount: 0 });
    get().clearMapAndResults();

    return new Promise((resolve) => {
      const process = async (latitude: number, longitude: number) => {
        try {
          const restaurants = await get().getNearbyRestaurants({ lat: latitude, lng: longitude });
          if (restaurants.length === 0) {
            resolve({ success: false, message: '주변에 조건에 맞는 음식점을 찾지 못했어요!' });
          } else {
            if (isRoulette) {
              if (restaurants.length < 2) {
                 resolve({ success: false, message: `주변에 추첨할 음식점이 ${get().filters.resultCount}개 미만입니다.` });
              } else {
                set({ rouletteItems: restaurants });
                resolve({ success: true, isRoulette: true, restaurants });
              }
            } else {
              set({ restaurantList: restaurants });
              resolve({ success: true, restaurants });
            }
          }
        } catch (error) {
          console.error("Error:", error);
          resolve({ success: false, message: '음식점을 불러오는 데 실패했습니다.' });
        } finally {
          set({ loading: false });
        }
      };

      if (center) {
        set({ userLocation: center });
        process(center.lat, center.lng);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            set({ userLocation: { lat: latitude, lng: longitude } });
            process(latitude, longitude);
          },
          (error) => {
            console.error("Geolocation error:", error);
            set({ loading: false });
            resolve({ success: false, message: '위치 정보를 가져오는 데 실패했습니다.' });
          }
        );
      }
    });
  },
  
  handleSearchInArea: async (center) => {
    set({ loading: true });
    get().clearMapAndResults();
    try {
        const restaurants = await get().getNearbyRestaurants(center);
        if (restaurants.length === 0) {
            // Let component handle alert
        } else {
            const { sortOrder, resultCount } = get().filters;
            const finalRestaurants = (sortOrder === 'distance' || sortOrder === 'rating')
                ? restaurants
                : [...restaurants].sort(() => 0.5 - Math.random()).slice(0, resultCount);
            set({ restaurantList: finalRestaurants });
        }
    } catch (error) {
        console.error("Error:", error);
        // Let component handle alert
    } finally {
        set({ loading: false });
    }
  },

  handleAddressSearch: async (keyword, center) => {
    if (!keyword.trim()) {
      // Let component handle alert
      return;
    }
    set({ loading: true });
    get().clearMapAndResults();
    set({ displayedSortOrder: get().filters.sortOrder });

    try {
        const restaurants = await get().getNearbyRestaurants(center, keyword);
        set({ restaurantList: restaurants });
        if (restaurants.length === 0) {
            // Let component handle alert
        }
    } catch (error) {
        // Let component handle alert
    } finally {
        set({ loading: false });
    }
  },

  handleRouletteResult: (winner) => {
    set({ restaurantList: [winner], selectedItemId: winner.id });
  },

  handleTagsChange: (updatedRestaurant) => {
    set(state => ({
      restaurantList: state.restaurantList.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r)
    }));
    // Note: This store does not manage favorites, so the call to updateFavoriteInList
    // needs to be handled in the component that uses the useFavorites hook.
  },
}));
