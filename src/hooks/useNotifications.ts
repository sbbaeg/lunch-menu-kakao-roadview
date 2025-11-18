
import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';

export function useNotifications() {
  const { data: session } = useSession();
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

      if (!isInitialFetch && data.length > 0) {
        const existingIds = new Set(notifications.map(n => n.id));
        const newUnreadNotifications = data.filter(n => !n.read && !existingIds.has(n.id));

        if (newUnreadNotifications.length > 0) {
          const message = newUnreadNotifications.length > 1 
            ? `${newUnreadNotifications.length}개의 새로운 알림이 있습니다.`
            : `새로운 알림: ${newUnreadNotifications[0].message}`;
          
          toast(message, {
            action: {
              label: '내용 보기',
              onClick: () => useAppStore.getState().showNotifications(),
            },
          });
        }
      }

      setNotifications(data);
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
  }, [session, isInitialFetch, notifications]);

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

      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, read: true } : n))
      );
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

      // 로컬 상태 업데이트
      if (notificationIds) {
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      } else {
        setNotifications(prev => prev.filter(n => !n.read));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return { 
    notifications, 
    unreadCount,
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead,
    deleteNotifications
  };
}
