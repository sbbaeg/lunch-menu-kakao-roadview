
import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@prisma/client';
import { useSession } from 'next-auth/react';

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('알림을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return { 
    notifications, 
    unreadCount,
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead 
  };
}
