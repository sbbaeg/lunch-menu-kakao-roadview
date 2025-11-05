"use client";

import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";

function getNotificationMessage(notification: any) {
  switch (notification.type) {
    case 'BANNED':
      return `관리자에 의해 계정이 차단되었습니다. 사유: ${notification.message}`;
    case 'TAG_SUBSCRIPTION':
      return `팔로우 중인 태그에 새로운 장소가 추가되었습니다: ${notification.message}`;
    case 'MODERATION':
        return notification.message;
    default:
      return notification.message;
  }
}

export function NotificationPopover() {
  const { notifications, unreadCount, markAsRead, fetchNotifications, deleteNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasReadNotifications = notifications.some(n => n.read);


  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications(); // 팝오버를 열 때마다 최신 알림을 가져옵니다.
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <Button variant="ghost" size="icon" className="relative" onClick={togglePopover}>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500" />
        )}
      </Button>
      {isOpen && (
        <div className="w-80 absolute right-0 z-50 mt-2 bg-popover text-popover-foreground rounded-md border p-4 shadow-md outline-none">
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
                    <div
                      key={notification.id}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                        !notification.read && "bg-accent"
                      )}
                    >
                      <div className="flex w-full flex-col gap-1">
                          <div className="flex items-center">
                              <div className="flex items-center gap-2">
                                  <div className="font-semibold">{getNotificationMessage(notification)}</div>
                              </div>
                              <div className={cn("ml-auto text-xs", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                                  {format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm")}
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => deleteNotifications([notification.id])}>
                                <X className="h-4 w-4" />
                              </Button>
                          </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">새로운 알림이 없습니다.</p>
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
  );
}