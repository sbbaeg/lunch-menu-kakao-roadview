import { create } from 'zustand';
import { AppRestaurant, RestaurantWithTags } from '@/lib/types';
import { FilterState } from '@/components/FilterDialog';
import { Notification as PrismaNotification } from '@prisma/client';
import { getSession } from 'next-auth/react';

export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

// Types moved from useNotifications.ts
export type UnifiedNotification = Omit<PrismaNotification, 'id'> & {
  id: string;
  title: string;
  link?: string;
  inquiry?: {
    id: number;
    title: string;
    message: string;
    adminReply: string | null;
    isFromAdmin: boolean;
  };
};

interface InquiryForNotification {
  id: number;
  title: string;
  message: string;
  adminReply: string | null;
  isResolved: boolean;
  isReadByUser: boolean;
  createdAt: string;
  updatedAt: string;
  isFromAdmin: boolean;
  userId: string;
}


export interface AppState {
  // State
  selectedItemId: string;
  restaurantList: AppRestaurant[];
  rouletteItems: AppRestaurant[];
  userLocation: { lat: number; lng: number } | null;
  activeTab: 'map' | 'favorites' | 'roulette' | 'my-page';
  activeView: 'tabs' | 'tagDetail' | 'restaurantDetail' | 'tagExplore' | 'myReviews' | 'ranking' | 'notifications' | 'favorites' | 'likedRestaurants' | 'settings';
  previousView: AppState['activeView'];
  activeTagId: number | null;
  activeRestaurantId: string | null;
  taggingRestaurant: AppRestaurant | null;
  fontSize: FontSize;
  showAppBadge: boolean;
  showNotificationsDialog: boolean;
  isBadgeManagementOpen: boolean;
  hoveredRestaurantId: string | null;

  // Filter State
  filters: Omit<FilterState, 'categories' | 'allowsDogsOnly' | 'hasParkingOnly'> & { categories: string[]; allowsDogsOnly: boolean; hasParkingOnly: boolean; };
  
  displayedSortOrder: 'accuracy' | 'distance' | 'rating';
  blacklistExcludedCount: number;
  loading: boolean;
  isMapReady: boolean;
  resultPanelState: 'collapsed' | 'default' | 'expanded';

  // Notification State
  notifications: UnifiedNotification[];
  unreadCount: number;
  notificationsLoading: boolean;
  notificationError: string | null;
  newBadgesCount: number;

  // Actions
  setResultPanelState: (state: 'collapsed' | 'default' | 'expanded') => void;
  resetResultPanelState: () => void;
  setActiveTab: (tab: 'map' | 'favorites' | 'roulette' | 'my-page') => void;
  
  goBack: () => void;
  showTagDetail: (tagId: number) => void;
  showRestaurantDetail: (restaurantId: string) => void;
  showTagExplore: () => void;
  showMyReviews: () => void;
  showRanking: () => void;
  showNotifications: () => void;
  showFavoritesPage: () => void;
  showLikedRestaurantsPage: () => void;
  showSettingsPage: () => void;
  hideSettingsPage: () => void;
  
  setSelectedItemId: (id: string) => void;
  setRestaurantList: (restaurants: AppRestaurant[]) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setFilters: (newFilters: Partial<AppState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setIsMapReady: (isMapReady: boolean) => void;
  setTaggingRestaurant: (restaurant: AppRestaurant | null) => void;
  setFontSize: (size: FontSize) => void;
  setShowAppBadge: (show: boolean) => void;
  setShowNotificationsDialog: (show: boolean) => void;
  setIsBadgeManagementOpen: (isOpen: boolean) => void;
  setHoveredRestaurantId: (id: string | null) => void;
  
  clearMapAndResults: () => void;
  getNearbyRestaurants: (center: { lat: number; lng: number }, query?: string) => Promise<AppRestaurant[]>;
  recommendProcess: (isRoulette: boolean, center?: { lat: number; lng: number }) => Promise<{ success: boolean; message?: string; isRoulette?: boolean, restaurants?: AppRestaurant[] }>;
  handleSearchInArea: (center: { lat: number; lng: number }) => void;
  handleAddressSearch: (keyword: string, center: { lat: number; lng: number }) => void;
  handleRouletteResult: (winner: AppRestaurant) => void;
  handleTagsChange: (updatedRestaurant: AppRestaurant) => void;

  // Notification Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationsByIds: (ids: string[]) => Promise<void>;
  markNewBadgesAsViewed: () => Promise<void>;
  initializeServiceWorker: () => void;
  fetchNewBadgesCount: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedItemId: '',
  restaurantList: [],
  rouletteItems: [],
  userLocation: null,
  activeTab: 'map',
  activeView: 'tabs',
  previousView: 'tabs',
  activeTagId: null,
  activeRestaurantId: null,
  taggingRestaurant: null,
  fontSize: 'normal',
  showAppBadge: true,
  showNotificationsDialog: false,
  isBadgeManagementOpen: false,
  hoveredRestaurantId: null,
  
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
    allowsDogsOnly: false,
    hasParkingOnly: false,
    wheelchairAccessibleEntrance: false,
    wheelchairAccessibleRestroom: false,
    wheelchairAccessibleSeating: false,
    wheelchairAccessibleParking: false,
  },

  displayedSortOrder: 'accuracy',
  blacklistExcludedCount: 0,
  loading: false,
  isMapReady: false,
  resultPanelState: 'default',

  // Initial Notification State
  notifications: [],
  unreadCount: 0,
  notificationsLoading: true,
  notificationError: null,
  newBadgesCount: 0,

  // --- ALL ACTIONS CONSOLIDATED HERE ---

  // Notification Actions
  fetchNotifications: async () => {
    const session = await getSession();
    if (!session?.user?.id) {
      set({ notifications: [], unreadCount: 0, notificationsLoading: false });
      return;
    }

    set({ notificationsLoading: true, notificationError: null });
    try {
      const [notificationsRes, inquiriesRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/inquiries')
      ]);

      if (!notificationsRes.ok) throw new Error('알림 목록을 불러오는 데 실패했습니다.');
      if (!inquiriesRes.ok) throw new Error('문의 목록을 불러오는 데 실패했습니다.');

      const notificationsData: any[] = await notificationsRes.json();
      const inquiriesData: InquiryForNotification[] = await inquiriesRes.json();
      
      const inquiryMap = new Map<number, InquiryForNotification>(
        inquiriesData.map(inq => [inq.id, inq])
      );

      const unifiedNotifications: UnifiedNotification[] = notificationsData.map(n => {
        const linkedInquiry = n.inquiryId ? inquiryMap.get(n.inquiryId) : undefined;
        if (linkedInquiry) {
          return {
            ...n,
            id: n.id.toString(),
            title: linkedInquiry.title,
            message: linkedInquiry.isFromAdmin ? linkedInquiry.message : linkedInquiry.adminReply || '관리자 답변이 등록되었습니다.',
            read: linkedInquiry.isReadByUser,
            type: linkedInquiry.isFromAdmin ? 'ADMIN_MESSAGE' : 'INQUIRY_REPLY',
            link: `/my-page/inquiries/${linkedInquiry.id}`,
            inquiry: {
              id: linkedInquiry.id,
              title: linkedInquiry.title,
              message: linkedInquiry.message,
              adminReply: linkedInquiry.adminReply,
              isFromAdmin: linkedInquiry.isFromAdmin,
            },
          };
        } else {
           let title = n.message;
          if (n.type === 'TAG_SUBSCRIPTION' && n.tag) {
            title = `"${n.tag.name}" 태그에 새로운 장소 추가`;
          }
          return { ...n, id: n.id.toString(), title };
        }
      });
      
      const notifiedInquiryIds = new Set(notificationsData.map(n => n.inquiryId).filter(id => id !== null));
      const unnotifiedInquiries: UnifiedNotification[] = inquiriesData
        .filter(inq => !notifiedInquiryIds.has(inq.id) && (inq.adminReply !== null || inq.isFromAdmin))
        .map(inq => ({
          id: `inquiry-${inq.id}`,
          userId: inq.userId,
          type: inq.isFromAdmin ? 'ADMIN_MESSAGE' : 'INQUIRY_REPLY',
          message: inq.isFromAdmin ? inq.message : inq.adminReply || '관리자 답변이 등록되었습니다.',
          read: inq.isReadByUser,
          createdAt: new Date(inq.createdAt),
          updatedAt: new Date(inq.updatedAt),
          inquiryId: inq.id,
          tagId: null,
          reviewId: null,
          title: inq.title,
          link: `/my-page/inquiries/${inq.id}`,
          inquiry: {
            id: inq.id,
            title: inq.title,
            message: inq.message,
            adminReply: inq.adminReply,
            isFromAdmin: inq.isFromAdmin,
          },
        }));

      const combined = [...unifiedNotifications, ...unnotifiedInquiries].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      set({ 
        notifications: combined, 
        unreadCount: combined.filter(n => !n.read).length,
      });
    } catch (err: any) {
      set({ notificationError: err.message });
    } finally {
      set({ notificationsLoading: false });
    }
  },

  markAllAsRead: async () => {
    const session = await getSession();
    if (!session?.user?.id || get().unreadCount === 0) return;

    const unreadGeneralIds = get().notifications
      .filter(n => !n.read && !n.id.startsWith('inquiry-'))
      .map(n => parseInt(n.id, 10));

    const unreadInquiryIds = get().notifications
      .filter(n => !n.read && n.id.startsWith('inquiry-'))
      .map(n => parseInt(n.id.replace('inquiry-', ''), 10));
      
    try {
      const promises = [];
      if (unreadGeneralIds.length > 0) {
        promises.push(fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadGeneralIds }),
        }));
      }
      if (unreadInquiryIds.length > 0) {
        promises.push(fetch('/api/inquiries/mark-as-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryIds: unreadInquiryIds }),
        }));
      }
      
      await Promise.all(promises);
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  },

  markNewBadgesAsViewed: async () => {
    const session = await getSession();
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/users/me/badges/mark-as-viewed', {
        method: 'POST',
      });
      if (response.ok) {
        get().fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark new badges as viewed:', error);
    }
  },

  markAsRead: async (id: string) => {
    const session = await getSession();
    if (!session?.user?.id) return;

    const notification = get().notifications.find(n => n.id === id);
    if (!notification || notification.read) return;

    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      const promises = [];
      const notificationId = parseInt(id, 10);

      if (!isNaN(notificationId)) {
        promises.push(fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: [notificationId] }),
        }));
      }
      
      if (notification.inquiryId) {
        promises.push(fetch('/api/inquiries/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inquiryIds: [notification.inquiryId] }),
        }));
      }
      await Promise.all(promises.map(p => p.catch(e => e)));
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
      // Revert on failure
      set(state => ({
        notifications: state.notifications.map(n => (n.id === id ? { ...n, read: false } : n)),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  deleteNotificationsByIds: async (ids: string[]) => {
    const session = await getSession();
    if (!session?.user?.id || ids.length === 0) return;

    const notificationsToDelete = get().notifications.filter(n => ids.includes(n.id));
    if (notificationsToDelete.length === 0) return;
    
    const originalNotifications = [...get().notifications];
    const originalUnreadCount = get().unreadCount;

    // Optimistic update
    set(state => ({
      notifications: state.notifications.filter(n => !ids.includes(n.id)),
      unreadCount: state.unreadCount - notificationsToDelete.filter(n => !n.read).length
    }));

    try {
      const notificationIds = notificationsToDelete.map(n => parseInt(n.id, 10)).filter(id => !isNaN(id));
      const inquiryIds = notificationsToDelete.map(n => n.inquiryId).filter((id): id is number => id !== null && id !== undefined);

      const promises = [];
      if (notificationIds.length > 0) {
        promises.push(fetch('/api/notifications', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds }),
        }));
      }
      if (inquiryIds.length > 0) {
        promises.push(fetch('/api/inquiries/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: inquiryIds }),
        }));
      }
      await Promise.all(promises);
    } catch (err: any) {
      console.error('Failed to delete notifications:', err);
      set({ notifications: originalNotifications, unreadCount: originalUnreadCount });
    }
  },

  initializeServiceWorker: () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log(`[SW_Init] Registration successful. Scope: ${registration.scope}`);
        })
        .catch(error => {
          console.error(`[SW_Init] Registration failed: ${error.message}`);
        });
    } else {
      console.warn('[SW_Init] Service Worker not supported.');
    }
  },

  fetchNewBadgesCount: async () => {
    const session = await getSession();
    if (!session?.user?.id) {
      set({ newBadgesCount: 0 });
      return;
    }
    try {
      const response = await fetch('/api/users/me/badges/new-count');
      if (response.ok) {
        const data = await response.json();
        set({ newBadgesCount: data.count });
      } else {
        set({ newBadgesCount: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch new badges count:', error);
      set({ newBadgesCount: 0 });
    }
  },

  // Original Actions
  setResultPanelState: (state) => set({ resultPanelState: state }),
  resetResultPanelState: () => set({ resultPanelState: 'default' }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  showTagDetail: (tagId) => set(state => ({ 
    activeView: 'tagDetail', 
    previousView: state.activeView, 
    activeTagId: tagId 
  })),
  
  showRestaurantDetail: (restaurantId) => set(state => ({
    activeView: 'restaurantDetail',
    previousView: state.activeView,
    activeRestaurantId: restaurantId
  })),

  showTagExplore: () => set({ activeView: 'tagExplore', previousView: 'tabs' }),
  showMyReviews: () => set({ activeView: 'myReviews', previousView: 'tabs' }),
  showRanking: () => set({ activeView: 'ranking', previousView: 'tabs' }),
  showNotifications: () => set({ activeView: 'notifications', previousView: 'tabs' }),
  showFavoritesPage: () => set({ activeView: 'favorites', previousView: 'tabs' }),
  showLikedRestaurantsPage: () => set({ activeView: 'likedRestaurants', previousView: 'tabs' }),
  showSettingsPage: () => set({ activeView: 'settings', previousView: 'tabs' }),

  goBack: () => set(state => {
    const isReturningFromDetail = state.activeView !== 'tabs';
    return {
      activeView: state.previousView, 
      previousView: 'tabs', 
      activeTagId: (isReturningFromDetail && state.activeView === 'tagDetail') ? null : state.activeTagId,
      activeRestaurantId: (isReturningFromDetail && state.activeView === 'restaurantDetail') ? null : state.activeRestaurantId,
    };
  }),

  hideTagDetail: () => get().goBack(),
  hideRestaurantDetail: () => get().goBack(),
  hideTagExplore: () => get().goBack(),
  hideMyReviews: () => get().goBack(),
  hideSettingsPage: () => get().goBack(),

  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setRestaurantList: (restaurants) => set({ restaurantList: restaurants }),
  setUserLocation: (location) => set({ userLocation: location }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setLoading: (loading) => set({ loading }),
  setIsMapReady: (isMapReady) => set({ isMapReady }),
  setTaggingRestaurant: (restaurant) => set({ taggingRestaurant: restaurant }),
  setFontSize: (size) => set({ fontSize: size }),
  setShowAppBadge: (show) => set({ showAppBadge: show }),
  setShowNotificationsDialog: (show) => set({ showNotificationsDialog: show }),
  setIsBadgeManagementOpen: (isOpen) => set({ isBadgeManagementOpen: isOpen }),
  setHoveredRestaurantId: (id) => set({ hoveredRestaurantId: id }),
    
  clearMapAndResults: () => { set({ selectedItemId: '', restaurantList: [] }); },
  
  getNearbyRestaurants: async (center, queryOverride) => {
    const { filters } = get();
    const query = queryOverride || (filters.categories.length > 0 ? filters.categories.join(',') : '음식점');
    
    let apiUrl = `/api/recommend?lat=${center.lat}&lng=${center.lng}&query=${encodeURIComponent(
      query
    )}&radius=${filters.distance}&sort=${filters.sortOrder}&size=${filters.resultCount}&minRating=${filters.minRating}&openNow=${filters.openNowOnly}&includeUnknown=${filters.includeUnknownHours}`;

    if (queryOverride) {
      apiUrl += `&source=search_bar`;
    }

    if (filters.tags.length > 0) {
      apiUrl += `&tags=${filters.tags.join(',')}`;
    }
    if (filters.searchInFavoritesOnly) {
      apiUrl += `&fromFavorites=true`;
    }
    if (filters.allowsDogsOnly) {
      apiUrl += `&allowsDogsOnly=true`;
    }
    if (filters.hasParkingOnly) {
      apiUrl += `&hasParkingOnly=true`;
    }
    if (filters.wheelchairAccessibleEntrance) {
      apiUrl += `&wheelchairAccessibleEntrance=true`;
    }
    if (filters.wheelchairAccessibleRestroom) {
      apiUrl += `&wheelchairAccessibleRestroom=true`;
    }
    if (filters.wheelchairAccessibleSeating) {
      apiUrl += `&wheelchairAccessibleSeating=true`;
    }
    if (filters.wheelchairAccessibleParking) {
      apiUrl += `&wheelchairAccessibleParking=true`;
    }
    apiUrl += `&_=${new Date().getTime()}`;

    const response = await fetch(apiUrl);
    const data: { documents?: (RestaurantWithTags & { likeCount?: number, dislikeCount?: number })[], blacklistExcludedCount?: number } = await response.json();

    const formattedRestaurants: AppRestaurant[] = (data.documents || []).map(place => ({
        id: place.id,
        googlePlaceId: place.id,
        placeName: place.place_name,
        categoryName: place.category_name,
        address: place.road_address_name,
        x: place.x,
        y: place.y,
        placeUrl: place.place_url,
        distance: place.distance,
        googleDetails: place.googleDetails,
        tags: place.tags,
        appReview: place.appReview,
        likeCount: place.likeCount ?? 0,
        dislikeCount: place.dislikeCount ?? 0,
    }));

    set({ blacklistExcludedCount: data.blacklistExcludedCount || 0 });
    return formattedRestaurants;
  },

  recommendProcess: async (isRoulette, center) => {
    get().resetResultPanelState();
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
    get().resetResultPanelState();
    set({ loading: true, userLocation: center });
    get().clearMapAndResults();
    try {
        const restaurants = await get().getNearbyRestaurants(center);
        set({ restaurantList: restaurants, displayedSortOrder: get().filters.sortOrder });
        if (restaurants.length === 0) {
        }
    } catch (error) {
        console.error("Error in handleSearchInArea:", error);
    } finally {
        set({ loading: false });
    }
  },

  handleAddressSearch: async (keyword, center) => {
    get().resetResultPanelState();
    if (!keyword.trim()) {
      return;
    }
    set({ loading: true });
    get().clearMapAndResults();
    set({ displayedSortOrder: get().filters.sortOrder });

    try {
        const restaurants = await get().getNearbyRestaurants(center, keyword);
        set({ restaurantList: restaurants });
        if (restaurants.length === 0) {
        }
    } catch (error) {
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
  },
}));