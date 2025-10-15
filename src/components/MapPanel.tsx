import { useState, useEffect } from 'react';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { Restaurant } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface MapPanelProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  userLocation: { lat: number; lng: number } | null;
  onSearchInArea: (center: { lat: number; lng: number }) => void;
  onAddressSearch: (keyword: string, mode: 'place' | 'food', center: { lat: number; lng: number }) => void;
}

export function MapPanel({
  restaurants,
  selectedRestaurant,
  userLocation,
  onSearchInArea,
  onAddressSearch,
}: MapPanelProps) {
  const { 
    isMapReady, 
    mapContainerRef, 
    mapInstance, 
    roadviewContainerRef, 
    roadviewInstance, 
    displayMarkers, 
    setCenter, 
    drawDirections, 
    displayRoadview 
  } = useKakaoMap();
  
  const [searchAddress, setSearchAddress] = useState("");
  const [searchMode, setSearchMode] = useState<'place' | 'food'>('place');
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isRoadviewVisible, setRoadviewVisible] = useState(false);

  useEffect(() => {
    if (isMapReady) displayMarkers(restaurants);
  }, [restaurants, isMapReady]);

  useEffect(() => {
    if (selectedRestaurant && userLocation) {
        setCenter(Number(selectedRestaurant.y), Number(selectedRestaurant.x));
        drawDirections(
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) }
        );
        displayRoadview({ lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) });
        // 선택된 음식점이 바뀌면 일단 지도를 보여주도록 설정
        setRoadviewVisible(false);
    }
  }, [selectedRestaurant, userLocation]);

  useEffect(() => {
    if (!mapInstance) return;
    const listener = window.kakao.maps.event.addListener(mapInstance, 'dragend', () => {
      setShowSearchAreaButton(true);
    });
    return () => {
      window.kakao.maps.event.removeListener(mapInstance, 'dragend', listener);
    };
  }, [mapInstance]);

  useEffect(() => {
    const timerId = setTimeout(() => {
        if (isRoadviewVisible) {
            roadviewInstance?.relayout();
        }
        mapInstance?.relayout();
    }, 10); // DOM이 변경될 시간을 약간 줍니다.
    return () => clearTimeout(timerId);
  }, [isRoadviewVisible, mapInstance, roadviewInstance]);


  const handleSearch = () => {
    if (!mapInstance) return;
    const center = mapInstance.getCenter();
    onAddressSearch(searchAddress, searchMode, { lat: center.getLat(), lng: center.getLng() });
  };
  
  const handleSearchAreaClick = () => {
    if (!mapInstance) return;
    setShowSearchAreaButton(false);
    const center = mapInstance.getCenter();
    onSearchInArea({ lat: center.getLat(), lng: center.getLng() });
  }

  return (
    <div className="w-full h-[800px] md:flex-grow rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-muted/40">
        {/* ... (검색창 UI는 변경 없음) ... */}
         <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={searchMode === 'place' ? "예: 강남역 (장소로 이동)" : "예: 마라탕 (주변 음식점 검색)"}
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background text-base h-11 flex-grow"
          />
          <div className="flex items-center justify-center space-x-2 shrink-0">
            <Label htmlFor="search-mode" className={`text-sm ${searchMode === 'place' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>장소</Label>
            <Switch id="search-mode" checked={searchMode === 'food'} onCheckedChange={(checked) => setSearchMode(checked ? 'food' : 'place')} />
            <Label htmlFor="search-mode" className={`text-sm ${searchMode === 'food' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>음식점</Label>
          </div>
          <Button size="lg" className="h-11 shrink-0" onClick={handleSearch}>검색</Button>
        </div>
      </div>
      <div className="relative flex-1">
        {showSearchAreaButton && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-md">
            <Button size="lg" onClick={handleSearchAreaClick} className="bg-white text-black rounded-full hover:bg-gray-200 shadow-lg">
              이 지역에서 재검색
            </Button>
          </div>
        )}
        
        <div ref={mapContainerRef} className={`w-full h-full transition-opacity duration-300 ${isRoadviewVisible ? "opacity-0 invisible" : "opacity-100 visible"}`} />
        <div ref={roadviewContainerRef} className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${isRoadviewVisible ? "opacity-100 visible" : "opacity-0 invisible"}`} />

        {selectedRestaurant && (
            <Button onClick={() => setRoadviewVisible((prev) => !prev)} variant="secondary" className="absolute top-3 right-3 z-10 shadow-lg">
                {isRoadviewVisible ? "지도 보기" : "로드뷰 보기"}
            </Button>
        )}
      </div>
    </div>
  );
}