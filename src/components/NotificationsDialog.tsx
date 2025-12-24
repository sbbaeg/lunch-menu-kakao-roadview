
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAppStore } from '@/store/useAppStore';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from 'lucide-react';
import { useNotifications, UnifiedNotification } from "@/hooks/useNotifications";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import NotificationListComponent from '@/components/mobile/NotificationListComponent';

interface NotificationsDialogProps {
  children: React.ReactNode;
}

export function NotificationsDialog({ children }: NotificationsDialogProps) {
  const showNotificationsDialog = useAppStore((state) => state.showNotificationsDialog);
  const setShowNotificationsDialog = useAppStore((state) => state.setShowNotificationsDialog);
  const router = useRouter(); // Get router instance

  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedNotification, setSelectedNotification] = useState<UnifiedNotification | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markAllAsRead, 
    markAsRead,
    deleteNotificationsByIds 
  } = useNotifications();

  // State for new inquiry form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleOpenChange = (open: boolean) => {
    setShowNotificationsDialog(open);
    if (!open) {
      // Reset views on close
      setView('list');
      setSelectedNotification(null);
      setSelectedIds([]);
    }
  };

  const handleViewDetails = (notification: UnifiedNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setView('detail');
  };
  
  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (currentTab: string) => {
    const filteredNotifications = notifications.filter(n => {
        if (currentTab === 'all') return true;
        if (currentTab === 'unread') return !n.read;
        return true;
    });
    const allIds = filteredNotifications.map(n => n.id);
    if (selectedIds.length === allIds.length && filteredNotifications.every(n => selectedIds.includes(n.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`선택된 ${selectedIds.length}개의 항목을 정말로 삭제하시겠습니까?`)) {
      return;
    }
    await deleteNotificationsByIds(selectedIds);
    toast.success(`${selectedIds.length}개의 항목이 삭제되었습니다.`);
    setSelectedIds([]);
  };

  const handleSubmitInquiry = async () => {
    if (title.trim().length === 0 || message.trim().length === 0) {
      toast.error('제목과 문의 내용을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });
      if (!response.ok) throw new Error('문의 접수 중 오류가 발생했습니다.');
      toast.success('문의가 성공적으로 접수되었습니다.');
      setTitle('');
      setMessage('');
      setView('list');
      // Optionally, refetch notifications to see the new inquiry (if backend supports showing user's own inquiries)
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryLabel = (notification: UnifiedNotification) => {
    if (notification.inquiry?.isFromAdmin) return '관리자 메시지';
    switch (notification.type) {
        case 'INQUIRY_REPLY': return '문의 답변';
        case 'TAG_SUBSCRIPTION': return '태그 알림';
        case 'REVIEW_UPVOTE':
        case 'BEST_REVIEW': return '리뷰 알림';
        case 'ADMIN_MESSAGE': return '관리자 메시지';
        default: return '일반 알림';
    }
  };

  const renderListView = () => (
    <>
      <DialogHeader>
        <DialogTitle>알림 및 문의</DialogTitle>
        <DialogDescription>전체 알림을 확인하거나 새 문의를 작성할 수 있습니다.</DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="all" className="w-full flex-grow flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">전체 알림</TabsTrigger>
          <TabsTrigger value="unread">읽지 않은 알림</TabsTrigger>
        </TabsList>
        <div className="flex-grow overflow-y-auto overflow-x-hidden pr-2 py-4">
          <TabsContent value="all">
            <NotificationListComponent
              notifications={notifications}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onDelete={deleteNotificationsByIds}
              onDeleteRead={() => deleteNotificationsByIds(notifications.filter(n => n.read).map(n => n.id))}
              hasReadNotifications={notifications.some(n => n.read)}
            />
          </TabsContent>
          <TabsContent value="unread">
            <NotificationListComponent
              notifications={notifications.filter(n => !n.read)}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onDelete={deleteNotificationsByIds}
              onDeleteRead={() => deleteNotificationsByIds(notifications.filter(n => n.read).map(n => n.id))}
              hasReadNotifications={notifications.some(n => n.read)}
            />
          </TabsContent>
        </div>
      </Tabs>
      <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
        <Button onClick={() => setView('create')} className="w-full sm:w-auto">새 문의 작성</Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handleSelectAll('all')} className="flex-grow">모두 선택</Button>
          <Button variant="destructive" onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="flex-grow">
            선택 삭제
          </Button>
        </div>
      </DialogFooter>
    </>
  );

  const renderDetailView = () => {
    if (!selectedNotification) return null;
    const { inquiry, link } = selectedNotification;

    const finalTitle = selectedNotification.title;

    return (
      <>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
            <DialogTitle className="truncate">{finalTitle}</DialogTitle>
          </div>
           <DialogDescription className="text-xs text-muted-foreground pt-2 space-y-1 pl-10">
              <div className="flex gap-2">
                  <span className="font-bold w-16">유형:</span>
                  <span>{getCategoryLabel(selectedNotification)}</span>
              </div>
              <div className="flex gap-2">
                  <span className="font-bold w-16">수신 일시:</span>
                  <span>{format(new Date(selectedNotification.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto overflow-x-hidden space-y-4 py-4">
          {inquiry ? (
            <>
              {inquiry.isFromAdmin ? (
                <div>
                  <Label className="font-semibold">관리자 메시지</Label>
                  <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">{inquiry.message}</div>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="font-semibold">문의 내용</Label>
                    <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">{inquiry.message}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">관리자 답변</Label>
                    <div className="mt-1 p-3 rounded-md border bg-primary/10 text-sm whitespace-pre-wrap min-h-[100px]">
                      {inquiry.adminReply || <span className="text-muted-foreground">아직 답변이 없습니다.</span>}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="p-4">{selectedNotification.message}</p>
          )}
        </div>
        <DialogFooter className="flex-shrink-0 justify-between pt-4">
          <div>
            {link && link !== '#' && (
              <Button onClick={() => {
                router.push(link);
                handleOpenChange(false);
              }}>
                페이지로 이동
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => setView('list')}>목록으로</Button>
        </DialogFooter>
      </>
    );
  };
  
  const renderCreateView = () => (
     <>
      <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
          <DialogTitle>새 문의 작성</DialogTitle>
        </div>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto overflow-x-hidden space-y-4 py-4">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문의 제목을 입력하세요." />
        </div>
        <div>
          <Label htmlFor="message">문의 내용</Label>
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="여기에 문의 내용을 입력하세요." />
        </div>
      </div>
      <DialogFooter className="flex-shrink-0 pt-4">
        <Button variant="secondary" onClick={() => setView('list')}>취소</Button>
        <Button onClick={handleSubmitInquiry} disabled={isSubmitting}>{isSubmitting ? '제출 중...' : '제출하기'}</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={showNotificationsDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[90vw] h-[70vh] flex flex-col">
        {view === 'list' && renderListView()}
        {view === 'detail' && renderDetailView()}
        {view === 'create' && renderCreateView()}
      </DialogContent>
    </Dialog>
  );
}
