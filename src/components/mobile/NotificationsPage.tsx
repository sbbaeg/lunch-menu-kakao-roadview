
"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function NotificationsPage() {
  const { notifications, isLoading, deleteNotifications } = useNotifications();
  const goBack = useAppStore((state) => state.goBack);

  const hasReadNotifications = notifications.some(n => n.read);

  const handleGoBack = () => {
    goBack();
  };

  return (
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
        {isLoading ? (
            <div className="p-4 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        ) : notifications.length > 0 ? (
          <div className="grid gap-2 p-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                  !notification.read && "bg-accent"
                )}
              >
                <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2 mr-4">
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
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">새로운 알림이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
