"use client";

import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationViewerDialog } from "./NotificationViewerDialog";
import { Notification as PrismaNotification } from "@prisma/client";

// Helper component to render each notification
const NotificationItem = ({ notification, onDelete, onClick }: { notification: PrismaNotification, onDelete: (id: number) => void, onClick: () => void }) => {
  
  const getNotificationTypeLabel = (type: PrismaNotification['type']) => {
    switch (type) {
      case 'GENERAL':
        return '메시지';
      case 'TAG_SUBSCRIPTION':
        return '태그';
      case 'REVIEW_UPVOTE':
      case 'BEST_REVIEW':
        return '리뷰';
      default:
        return '알림';
    }
  };

  return (
    <div
      key={notification.id}
      className={cn(
        "w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all cursor-pointer hover:bg-muted/50",
        !notification.read && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="font-semibold flex items-center gap-2 overflow-hidden">
          <p className="truncate">{notification.message}</p>
          {!notification.read && <span className="block h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center flex-shrink-0">
          <div className={cn("text-xs pl-2", !notification.read ? "text-foreground" : "text-muted-foreground")}>
            {format(new Date(notification.createdAt), "MM-dd HH:mm")}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export function NotificationPopover() {
  const { notifications, unreadCount, fetchNotifications, deleteNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<PrismaNotification | null>(null);
  const lastNotificationDateRef = useRef<Date | null>(null);


  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (notifications.length > 0) {
      // Initialize the ref on first load without showing a toast.
      if (lastNotificationDateRef.current === null) {
        lastNotificationDateRef.current = new Date(notifications[0].createdAt);
        return;
      }
  
      const latestNotification = notifications[0];
      if (new Date(latestNotification.createdAt) > lastNotificationDateRef.current) {
        toast(latestNotification.message, {
          action: {
            label: "내용 보기",
            onClick: () => setSelectedNotification(latestNotification),
          },
        });
        // Update the ref. This does not cause a re-render.
        lastNotificationDateRef.current = new Date(latestNotification.createdAt);
      }
    }
  }, [notifications]);

  const hasReadNotifications = notifications.some(n => n.read);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications();
    }
  };

  const togglePopover = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      handleOpenChange(true);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen && !selectedNotification) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectedNotification]);

  const handleDeleteAndCloseDialog = (notificationId: number) => {
    deleteNotifications([notificationId]);
    setSelectedNotification(null);
  };

  const getLinkForNotification = (notification: PrismaNotification | null): string | null => {
    if (!notification) return null;
    try {
      // This is for older notifications that had a JSON message
      const parsed = JSON.parse(notification.message);
      if (notification.type === 'TAG_SUBSCRIPTION' && parsed.tagId) {
        return `/tags/${parsed.tagId}`;
      }
      if ((notification.type === 'REVIEW_UPVOTE' || notification.type === 'BEST_REVIEW') && parsed.restaurantId) {
        return `/restaurants/${parsed.restaurantId}`;
      }
    } catch (e) {
      // Not a JSON message, which is expected for new GENERAL notifications
    }
    return null;
  };

  return (
    <>
      <div className="relative" ref={popoverRef}>
        <Button variant="ghost" size="icon" className="relative" onClick={togglePopover}>
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
        {isOpen && (
          <div className="w-96 absolute right-0 z-50 mt-2 bg-popover text-popover-foreground rounded-md border p-4 shadow-md outline-none">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">알림</h4>
                <p className="text-sm text-muted-foreground">
                  최근 알림 {notifications.length}개가 표시됩니다.
                </p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="grid gap-2">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onDelete={() => deleteNotifications([notification.id])}
                        onClick={() => setSelectedNotification(notification)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center">새로운 알림이 없습니다.</p>
                  )}
                </div>
              </ScrollArea>
              {hasReadNotifications && (
                <>
                  <Separator />
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => deleteNotifications()}
                    >
                      읽은 알림 모두 삭제
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
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
