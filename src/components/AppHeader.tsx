// src/components/AppHeader.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Notification as PrismaNotification } from '@prisma/client';
import { useNotifications } from '@/hooks/useNotifications';
import { useInquiryNotifications } from '@/hooks/useInquiryNotifications';
import { useFavorites } from '@/hooks/useFavorites';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useUserTags } from '@/hooks/useUserTags';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useLikedRestaurants } from '@/hooks/useLikedRestaurants';
import { useAppStore } from '@/store/useAppStore';

import { SideMenuSheet } from '@/components/SideMenuSheet';
import { NotificationPopover } from '@/components/ui/NotificationPopover';
import { NotificationViewerDialog } from '@/components/ui/NotificationViewerDialog';
import { FavoritesDialog } from '@/components/FavoritesDialog';
import { BlacklistDialog } from '@/components/BlacklistDialog';
import { TagManagementDialog } from '@/components/TagManagementDialog';
import { MyReviewsDialog } from '@/components/MyReviewsDialog';
import { LikedRestaurantsDialog } from '@/components/LikedRestaurantsDialog';
import { TaggingDialog } from '@/components/TaggingDialog';
import { AppRestaurant, Tag } from '@/lib/types';
import { toast } from 'sonner';

export function AppHeader() {
  const { data: session, status } = useSession();
  const [selectedNotification, setSelectedNotification] = useState<PrismaNotification | null>(null);
  const { taggingRestaurant, setTaggingRestaurant } = useAppStore();

  const handleNewNotification = (notification: PrismaNotification) => {
    toast(notification.message, {
      action: {
        label: "내용 보기",
        onClick: () => setSelectedNotification(notification),
      },
    });
  };

  const { notifications, unreadCount, deleteNotifications } = useNotifications({
    onNewNotification: handleNewNotification,
  });
  const { unreadInquiryCount } = useInquiryNotifications();

  // Hooks for dialogs managed by the header
  const { favorites, isFavorite, toggleFavorite, updateFavoriteInList } = useFavorites();
  const { blacklist, isBlacklisted, toggleBlacklist } = useBlacklist();
  const { userTags, createTag, deleteTag, toggleTagPublic } = useUserTags();
  const { subscribedTagIds } = useSubscriptions();
  const { likedRestaurants, isLoading: isLoadingLiked } = useLikedRestaurants();

  // State for dialogs
  const [isFavoritesListOpen, setIsFavoritesListOpen] = useState(false);
  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isMyReviewsOpen, setIsMyReviewsOpen] = useState(false);
  const [isLikedRestaurantsOpen, setIsLikedRestaurantsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");


  const handleBlacklistClick = () => {
    if (status === 'authenticated') {
      setIsBlacklistOpen(true);
    } else {
      toast.error("로그인이 필요한 기능입니다.");
    }
  };

  const handleDeleteAndCloseDialog = (notificationId: number) => {
    deleteNotifications([notificationId]);
    setSelectedNotification(null);
  };

  const getLinkForNotification = (notification: PrismaNotification | null): string | null => {
    if (!notification) return null;
    try {
      const parsed = JSON.parse(notification.message);
      if (notification.type === 'TAG_SUBSCRIPTION' && parsed.tagId) {
        return `/tags/${parsed.tagId}`;
      }
      if ((notification.type === 'REVIEW_UPVOTE' || notification.type === 'BEST_REVIEW') && parsed.restaurantId) {
        return `/restaurants/${parsed.restaurantId}`;
      }
    } catch (e) {
      // ignore parsing errors
    }
    return null;
  };

  // These handlers are now passed down from AppHeader if needed, or handled within AppHeader's dialogs
  const handleTagsChange = (updatedRestaurant: AppRestaurant) => {
    // This logic might need to be lifted further up if it affects pages directly
    // For now, it updates the list within the favorites dialog
    updateFavoriteInList(updatedRestaurant);
  };

  const handleCreateAndLinkTag = async (name: string) => {
    if (!name.trim() || !taggingRestaurant) return;
    const newTag = await createTag(name);
    if (newTag) {
      const linkResponse = await fetch(`/api/restaurants/${taggingRestaurant.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: newTag.id, restaurant: taggingRestaurant }),
      });
      if (linkResponse.ok) {
        const updatedRestaurant = {
          ...taggingRestaurant,
          tags: [...(taggingRestaurant.tags || []), newTag],
        };
        handleTagsChange(updatedRestaurant);
        setTaggingRestaurant(updatedRestaurant);
      } else {
        toast.error("태그 연결에 실패했습니다.");
      }
    }
  };

  const handleToggleTagLink = async (tag: Tag) => {
    if (!session?.user || !taggingRestaurant) return;
    const originalRestaurant = taggingRestaurant;
    const isCurrentlyTagged = taggingRestaurant.tags?.some(t => t.id === tag.id);
    const newTags = isCurrentlyTagged
      ? taggingRestaurant.tags?.filter(t => t.id !== tag.id)
      : [...(taggingRestaurant.tags || []), tag];
    const updatedRestaurant = { ...originalRestaurant, tags: newTags };
    handleTagsChange(updatedRestaurant);
    setTaggingRestaurant(updatedRestaurant);

    try {
      const response = await fetch(`/api/restaurants/${originalRestaurant.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, restaurant: originalRestaurant }),
      });
      if (!response.ok) {
        handleTagsChange(originalRestaurant);
        setTaggingRestaurant(originalRestaurant);
        toast.error("태그 변경에 실패했습니다.");
      }
    } catch (error) {
        handleTagsChange(originalRestaurant);
        setTaggingRestaurant(originalRestaurant);
        toast.error("태그 변경 중 네트워크 오류가 발생했습니다.");
    }
  };

  const hasUnreadNotifications = unreadCount > 0 || unreadInquiryCount > 0;

  return (
    <>
      <div className="absolute top-2 right-2 z-50 flex items-center">
        <NotificationPopover
          notifications={notifications}
          unreadCount={unreadCount}
          deleteNotifications={deleteNotifications}
          onNotificationClick={(n) => setSelectedNotification(n)}
        />
        <div className="relative">
          <SideMenuSheet
            onShowFavorites={() => setIsFavoritesListOpen(true)}
            onShowBlacklist={handleBlacklistClick}
            onShowTagManagement={() => setIsTagManagementOpen(true)}
            onShowMyReviews={() => setIsMyReviewsOpen(true)}
            onShowLikedRestaurants={() => setIsLikedRestaurantsOpen(true)}
            unreadInquiryCount={unreadInquiryCount}
          />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
      </div>

      {/* Dialogs that are triggered from the header */}
      <FavoritesDialog
        isOpen={isFavoritesListOpen}
        onOpenChange={setIsFavoritesListOpen}
        favorites={favorites}
        session={session}
        subscribedTagIds={subscribedTagIds}
        selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId}
        isFavorite={isFavorite}
        isBlacklisted={isBlacklisted}
        onToggleFavorite={toggleFavorite}
        onToggleBlacklist={toggleBlacklist}
        onTagManagement={setTaggingRestaurant}
        onNavigate={() => setIsFavoritesListOpen(false)}
      />
      <BlacklistDialog
        isOpen={isBlacklistOpen}
        onOpenChange={setIsBlacklistOpen}
        blacklist={blacklist}
        onToggleBlacklist={toggleBlacklist}
      />
      <TagManagementDialog
        isOpen={isTagManagementOpen}
        onOpenChange={setIsTagManagementOpen}
        userTags={userTags}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        onToggleTagPublic={toggleTagPublic}
      />
      <MyReviewsDialog
        isOpen={isMyReviewsOpen}
        onOpenChange={setIsMyReviewsOpen}
      />
      <LikedRestaurantsDialog
        isOpen={isLikedRestaurantsOpen}
        onOpenChange={setIsLikedRestaurantsOpen}
        onNavigate={() => setIsLikedRestaurantsOpen(false)}
        likedRestaurants={likedRestaurants}
        isLoading={isLoadingLiked}
        session={session}
        subscribedTagIds={subscribedTagIds}
        selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId}
        isFavorite={isFavorite}
        isBlacklisted={isBlacklisted}
        onToggleFavorite={toggleFavorite}
        onToggleBlacklist={toggleBlacklist}
        onTagManagement={setTaggingRestaurant}
      />
      <TaggingDialog
        restaurant={taggingRestaurant}
        onOpenChange={() => setTaggingRestaurant(null)}
        userTags={userTags}
        onToggleTagLink={handleToggleTagLink}
        onCreateAndLinkTag={handleCreateAndLinkTag}
        isBanned={session?.user?.isBanned ?? false}
      />
      {selectedNotification && (
        <NotificationViewerDialog
          isOpen={!!selectedNotification}
          onOpenChange={() => setSelectedNotification(null)}
          notification={selectedNotification}
          onDelete={handleDeleteAndCloseDialog}
          link={getLinkForNotification(selectedNotification)}
        />
      )}
    </>
  );
}
