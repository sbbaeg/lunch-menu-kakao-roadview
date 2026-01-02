import React from 'react';

interface NotificationCountBadgeProps {
  count: number;
}

export const NotificationCountBadge: React.FC<NotificationCountBadgeProps> = ({ count }) => {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
};
