
"use client";

import { useNotifications, UnifiedNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react"; // ArrowLeft 제거
import { useState } from "react"; // useEffect 제거, useAppStore 제거
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton 추가


// Helper component to render each notification
const NotificationItem = ({ 
  notification, 
  onDelete, 
  onViewDetails 
}: { 
  notification: UnifiedNotification, 
  onDelete: (ids: string[]) => void, 
  onViewDetails: (notification: UnifiedNotification) => void 
}) => {
  // Use notification.id directly for key, as it's now string
  return (
    <div
      key={notification.id}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all cursor-pointer hover:bg-muted/50 overflow-hidden",
        !notification.read && "bg-accent"
      )}
      onClick={() => onViewDetails(notification)}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold flex-grow mr-2 truncate min-w-0">{notification.title}</div> {/* Changed to title */}
          <div className={cn("ml-auto text-xs pl-2 flex-shrink-0", !notification.read ? "text-foreground" : "text-muted-foreground")}>
            {format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm")}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onDelete([notification.id]); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground truncate w-full">
          {notification.message}
        </p>
      </div>
    </div>
  );
};

// Renamed and refactored to be a list component used by NotificationsDialog
interface NotificationListComponentProps {
    notifications: UnifiedNotification[];
    isLoading: boolean;
    onViewDetails: (notification: UnifiedNotification) => void;
    onDelete: (ids: string[]) => void;
    onDeleteRead: (ids: string[]) => void; // Added for deleting all read notifications
    hasReadNotifications: boolean;
}

export default function NotificationListComponent({ 
    notifications, 
    isLoading, 
    onViewDetails, 
    onDelete, 
    onDeleteRead,
    hasReadNotifications,
}: NotificationListComponentProps) {
  
  if (isLoading) {
    return (
      <div className="grid gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 border rounded-lg flex justify-between items-center">
            <div className="flex-grow space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-5 w-5 ml-4" />
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">새로운 알림이 없습니다.</p>;
  }

  return (
    <div className="grid gap-2 p-4">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

