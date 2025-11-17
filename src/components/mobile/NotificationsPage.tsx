
"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useState, useEffect } from "react";
import { Notification as PrismaNotification } from "@prisma/client";
import { NotificationViewerDialog } from "@/components/ui/NotificationViewerDialog";


// Helper component to render each notification
const NotificationItem = ({ notification, onDelete, onClick }: { notification: PrismaNotification, onDelete: (id: number) => void, onClick: () => void }) => {
  return (
    <div
      key={notification.id}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all cursor-pointer hover:bg-muted/50",
        !notification.read && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold flex-grow mr-2 truncate">{notification.message}</div>
          <div className={cn("ml-auto text-xs pl-2 flex-shrink-0", !notification.read ? "text-foreground" : "text-muted-foreground")}>
            {format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm")}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const { notifications, deleteNotifications } = useNotifications();
  const goBack = useAppStore((state) => state.goBack);
  const [selectedNotification, setSelectedNotification] = useState<PrismaNotification | null>(null);

  const hasReadNotifications = notifications.some(n => n.read);

  const handleGoBack = () => {
    goBack();
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
      // Not a JSON message
    }
    return null;
  };


  return (
    <>
      <div className="h-full w-full flex flex-col bg-background">
        <header className="p-4 border-b flex-shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">알림</h1>
          </div>
          {hasReadNotifications && (
              <Button variant="outline" size="sm" onClick={() => deleteNotifications()}>
                  읽은 알림 삭제
              </Button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="grid gap-2 p-4">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onDelete={() => deleteNotifications([notification.id])}
                  onClick={() => setSelectedNotification(notification)}
                />
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground text-center">새로운 알림이 없습니다.</p>
          )}
        </main>
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
