
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Inquiry {
  id: number;
  title: string;
  message: string;
  adminReply: string | null;
  isResolved: boolean;
  isReadByUser: boolean;
  createdAt: string;
}

export function useInquiryNotifications() {
  const { data: session } = useSession();
  const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    if (!session?.user?.id) {
      setUnreadInquiryCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/inquiries');
      if (!response.ok) {
        throw new Error('문의 목록을 불러오는 데 실패했습니다.');
      }
      const data: Inquiry[] = await response.json();
      setInquiries(data);
      const unreadCount = data.filter(inq => inq.isResolved && !inq.isReadByUser).length;
      setUnreadInquiryCount(unreadCount);
    } catch (err: any) {
      setError(err.message);
      setUnreadInquiryCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const markInquiriesAsRead = useCallback(async () => {
    if (!session?.user?.id || unreadInquiryCount === 0) return;

    try {
      const response = await fetch('/api/inquiries/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('문의를 읽음으로 표시하는 데 실패했습니다.');
      }
      // Optimistically update state
      setInquiries(prev => prev.map(inq => ({ ...inq, isReadByUser: true })));
      setUnreadInquiryCount(0);
    } catch (err: any) {
      console.error('Failed to mark inquiries as read:', err);
      setError(err.message);
    }
  }, [session?.user?.id, unreadInquiryCount]);

  useEffect(() => {
    fetchInquiries();
    // Poll for new inquiries every 30 seconds
    const interval = setInterval(fetchInquiries, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchInquiries]);

  return {
    unreadInquiryCount,
    inquiries,
    isLoading,
    error,
    fetchInquiries,
    markInquiriesAsRead,
  };
}
