"use client";

import { useState } from 'react';
import BottomTabBar from './BottomTabBar';

// 각 탭에 해당하는 페이지 컴포넌트 (임시)
const MapPage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">지도 화면</div>;
const FavoritesPage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">즐겨찾기 화면</div>;
const RoulettePage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">룰렛 화면</div>;
const MyPage = () => <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">마이페이지</div>;

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<'map' | 'favorites' | 'roulette' | 'my-page'>('map');

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <MapPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'roulette':
        return <RoulettePage />;
      case 'my-page':
        return <MyPage />;
      default:
        return <MapPage />;
    }
  };

  const handleSearchClick = () => {
    // TODO: Implement search action (e.g., open a search modal or trigger the main search function)
    alert('중앙 검색 버튼 클릭!');
  };

  return (
    <div className="h-dvh w-screen flex flex-col bg-background">
      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* 하단 탭 바 */}
      <BottomTabBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSearchClick={handleSearchClick} 
      />
    </div>
  );
}
