
import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';

interface UseNotificationsOptions {
  onNewNotification?: (notification: Notification) => void;
}

export function useNotifications({ onNewNotification }: UseNotificationsOptions = {}) {
  const { data: session } = useSession();
  const setUnreadNotificationCount = useAppStore((state) => state.setUnreadNotificationCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;

    if (isInitialFetch) {
      setIsLoading(true);
    }
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('알림을 불러오는데 실패했습니다.');
      }
      const data: Notification[] = await response.json();
      
      setUnreadNotificationCount(data.filter(n => !n.read).length);

      setNotifications(prevNotifications => {
        if (!isInitialFetch && data.length > 0 && onNewNotification) {
          const existingIds = new Set(prevNotifications.map(n => n.id));
          const newUnreadNotifications = data.filter(n => !n.read && !existingIds.has(n.id));
          
          newUnreadNotifications.forEach(notification => {
            onNewNotification(notification);
          });
        }
        return data;
      });

      if (isInitialFetch) {
        setIsInitialFetch(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      }
    }
  }, [session, isInitialFetch, onNewNotification, setUnreadNotificationCount]);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  const markAsRead = async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('알림을 읽음 처리하는데 실패했습니다.');
      }

      // 서버로부터 최신 데이터를 다시 가져와 상태를 동기화
      await fetchNotifications();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteNotifications = async (notificationIds?: number[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: notificationIds ? JSON.stringify({ notificationIds }) : undefined,
      });

      if (!response.ok) {
        throw new Error('알림을 삭제하는데 실패했습니다.');
      }

      // 서버로부터 최신 데이터를 다시 가져와 상태를 동기화
      await fetchNotifications();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };
  
  return { 
    notifications, 
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead,
    deleteNotifications
  };
}
