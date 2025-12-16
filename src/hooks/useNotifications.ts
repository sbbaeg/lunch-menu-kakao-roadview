import { useAppStore } from '@/store/useAppStore';
import type { Notification as PrismaNotification } from '@prisma/client';

// The type definition remains here so other components can import it.
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

/**
 * This hook provides a centralized way to access notification state and actions
 * from the global `useAppStore`.
 */
export function useNotifications() {
  const notifications = useAppStore((state) => state.notifications);
  const unreadCount = useAppStore((state) => state.unreadCount);
  const notificationsLoading = useAppStore((state) => state.notificationsLoading);
  const notificationError = useAppStore((state) => state.notificationError);
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);
  const markAsRead = useAppStore((state) => state.markAsRead);
  const markAllAsRead = useAppStore((state) => state.markAllAsRead);
  const deleteNotificationsByIds = useAppStore((state) => state.deleteNotificationsByIds);

  return {
    notifications,
    unreadCount,
    isLoading: notificationsLoading, // Keep original return name 'isLoading' for compatibility
    error: notificationError,       // Keep original return name 'error' for compatibility
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotificationsByIds,
  };
}