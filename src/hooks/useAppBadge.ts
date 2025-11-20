'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export function useAppBadge() {
  const showAppBadge = useAppStore((state) => state.showAppBadge);
  const [unreadCount, setUnreadCount] = useState(0);

  toast.success('useAppBadge hook initialized!');

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
        toast.info(`Fetched unread count: ${data.unreadCount}`);
      } else {
        toast.error('Failed to fetch unread count: Response not OK');
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      toast.error('Failed to fetch unread count: Exception');
    }
  };

  // Fetch count on initial load & track mount/unmount
  useEffect(() => {
    toast.info('useAppBadge mounted. Fetching count...');
    fetchUnreadCount();

    return () => {
        toast.warning('useAppBadge unmounted!');
    }
  }, []);
  
  // Update badge when count or setting changes
  useEffect(() => {
    toast.info(`Badge effect triggered. Count: ${unreadCount}, Show: ${showAppBadge}`);
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      if (showAppBadge && unreadCount > 0) {
        toast.success(`Setting app badge to: ${unreadCount}`);
        navigator.setAppBadge(unreadCount);
      } else {
        toast.warning(`Clearing app badge. Reason: showAppBadge=${showAppBadge}, unreadCount=${unreadCount}`);
        navigator.clearAppBadge();
      }
    } else {
        toast.error('Badging API not supported.');
    }
  }, [unreadCount, showAppBadge]);

  // Refetch when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        toast.info('App became visible. Refetching count...');
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
