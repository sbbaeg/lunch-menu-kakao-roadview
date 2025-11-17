"use client";

import { useAppStore } from '@/store/useAppStore';
import { Map, Heart, Search, Dices, User } from 'lucide-react';

// 탭 종류를 타입으로 정의
type Tab = 'map' | 'favorites' | 'roulette' | 'my-page';

// BottomTabBar가 받을 props 타입 정의
interface BottomTabBarProps {
  onSearchClick: () => void;
  hasUnreadNotifications: boolean;
}

// 일반 탭 아이템을 위한 재사용 컴포넌트
const TabItem = ({ icon, label, isActive, onClick, hasNotification }: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  hasNotification?: boolean;
}) => (
  <button 
    onClick={onClick} 
    className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
    {icon}
    <span className="text-xs font-medium">{label}</span>
    {hasNotification && (
        <span className="absolute top-2 right-4 block h-2 w-2 rounded-full bg-red-500" />
    )}
  </button>
);

export default function BottomTabBar({ onSearchClick, hasUnreadNotifications }: BottomTabBarProps) {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  return (
    <footer className="relative h-20 w-full border-t bg-background shadow-inner">
      {/* 중앙 검색 버튼 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button 
          onClick={onSearchClick}
          aria-label="Search"
          className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <Search className="h-8 w-8" />
        </button>
      </div>

      {/* 탭 아이템들을 담는 컨테이너 */}
      <div className="flex h-full">
        {/* 왼쪽 탭 2개 */}
        <div className="w-1/2 flex">
          <TabItem 
            icon={<Map className="h-6 w-6" />}
            label="지도"
            isActive={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          />
          <TabItem 
            icon={<Heart className="h-6 w-6" />}
            label="즐겨찾기"
            isActive={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          />
        </div>

        {/* 중앙 버튼이 차지할 공간 */}
        <div className="w-20" />

        {/* 오른쪽 탭 2개 */}
        <div className="w-1/2 flex">
          <TabItem 
            icon={<Dices className="h-6 w-6" />}
            label="룰렛"
            isActive={activeTab === 'roulette'}
            onClick={() => setActiveTab('roulette')}
          />
          <TabItem 
            icon={<User className="h-6 w-6" />}
            label="마이페이지"
            isActive={activeTab === 'my-page'}
            onClick={() => setActiveTab('my-page')}
            hasNotification={hasUnreadNotifications}
          />
        </div>
      </div>
    </footer>
  );
}
