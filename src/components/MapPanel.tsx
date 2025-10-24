// src/components/MapPanel.tsx

import { useState, useEffect, useRef } from 'react';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { AppRestaurant } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface MapPanelProps {
  restaurants: AppRestaurant[];
  selectedRestaurant: AppRestaurant | null;
  userLocation: { lat: number; lng: number } | null;
  onSearchInArea: (center: { lat: number; lng: number }) => void;
  onAddressSearch: (keyword: string, mode: 'place' | 'food', center: { lat: number; lng: number }) => void;
  onMapReady?: (isReady: boolean) => void;
  hideControls?: boolean;
  showSearchBar?: boolean; // 검색창 표시 여부 prop 추가
}

export function MapPanel({
  restaurants,
  selectedRestaurant,
  userLocation,
  onSearchInArea,
  onAddressSearch,
  onMapReady,
  hideControls = false,
  showSearchBar = true, // 기본값은 true
}: MapPanelProps) {
  const { isMapInitialized, mapContainerRef, mapInstance, roadviewContainerRef, roadviewInstance, clearOverlays, displayMarkers, setCenter, drawDirections, displayRoadview, relayout } = useKakaoMap();
  
  const [searchAddress, setSearchAddress] = useState("");
  const [searchMode, setSearchMode] = useState<'place' | 'food'>('place');
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isRoadviewVisible, setRoadviewVisible] = useState(false);

  useEffect(() => {
    if (onMapReady) {
      onMapReady(isMapInitialized);
    }
  }, [isMapInitialized, onMapReady]);

  // ResizeObserver를 사용하여 컨테이너 크기 변경 시 지도 리레이아웃
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || !isMapInitialized) return;

    let observer: ResizeObserver;

    const checkAndRelayout = () => {
      // 컨테이너가 실제로 화면에 표시되고 크기를 가졌을 때 relayout 호출
      if (mapContainer.clientWidth > 0 && mapContainer.clientHeight > 0) {
        relayout();
        // 한번 relayout을 실행한 후에는 observer를 중단하여 불필요한 반복을 막음
        if (observer) {
          observer.disconnect();
        }
      }
    };

    observer = new ResizeObserver(() => {
      checkAndRelayout();
    });

    observer.observe(mapContainer);

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isMapInitialized, mapContainerRef, relayout]);

  useEffect(() => {
    if (isMapInitialized) {
      clearOverlays();
      displayMarkers(restaurants);
    }
  }, [restaurants, isMapInitialized]);

  useEffect(() => {
    if (isMapInitialized && selectedRestaurant) {
        setCenter(Number(selectedRestaurant.y), Number(selectedRestaurant.x));
        displayRoadview({ lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) });
        setRoadviewVisible(false);
        if (userLocation) {
            drawDirections(
                { lat: userLocation.lat, lng: userLocation.lng },
                { lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) }
            );
        }
    }
}, [selectedRestaurant, userLocation, isMapInitialized]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps?.event) return;
    const handleDragEnd = () => { setShowSearchAreaButton(true); };
    window.kakao.maps.event.addListener(mapInstance, 'dragend', handleDragEnd);
    return () => {
      // Check if kakao objects still exist on cleanup
      if (window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(mapInstance, 'dragend', handleDragEnd);
      }
    };
  }, [mapInstance]);

  useEffect(() => {
    const timerId = setTimeout(() => {
        if (isRoadviewVisible) roadviewInstance?.relayout();
        mapInstance?.relayout();
    }, 10);
    return () => clearTimeout(timerId);
  }, [isRoadviewVisible, mapInstance, roadviewInstance]);

  useEffect(() => {
    if (userLocation && !selectedRestaurant) {
      setCenter(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  useEffect(() => {
    if (isMapInitialized && restaurants.length > 0 && !userLocation && !selectedRestaurant) {
      const firstRestaurant = restaurants[0];
      setCenter(Number(firstRestaurant.y), Number(firstRestaurant.x));
    }
  }, [isMapInitialized, restaurants, userLocation, selectedRestaurant]);

  const handleSearch = () => {
    if (!mapInstance || !searchAddress.trim() || !window.kakao?.maps?.services) return;
    if (searchMode === 'place') {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(searchAddress, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const firstPlace = data[0];
          setCenter(Number(firstPlace.y), Number(firstPlace.x));
        } else {
          alert('검색 결과가 없습니다.');
        }
      });
    } else {
      const center = mapInstance.getCenter();
      onAddressSearch(searchAddress, searchMode, { lat: center.getLat(), lng: center.getLng() });
    }
  };
  
  const handleSearchAreaClick = () => {
    if (!mapInstance) return;
    setShowSearchAreaButton(false);
    const center = mapInstance.getCenter();
    onSearchInArea({ lat: center.getLat(), lng: center.getLng() });
  }

  return (
    <div className="w-full h-full rounded-lg border shadow-sm flex flex-col overflow-hidden">
      {showSearchBar && (
        <div className="p-4 border-b bg-muted/40">
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
      )}

      <div className="relative flex-1">
        {showSearchAreaButton && !hideControls && showSearchBar && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-md">
            <Button size="lg" onClick={handleSearchAreaClick} className="bg-white text-black rounded-full hover:bg-gray-200 shadow-lg">
              이 지역에서 재검색
            </Button>
          </div>
        )}
        
        <div ref={mapContainerRef} className={`w-full h-full transition-opacity duration-300 ${isRoadviewVisible ? "opacity-0 invisible" : "opacity-100 visible"}`} />
        <div ref={roadviewContainerRef} className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${isRoadviewVisible ? "opacity-100 visible" : "opacity-0 invisible"}`} />

        {!hideControls && selectedRestaurant && (
            <Button onClick={() => setRoadviewVisible((prev) => !prev)} variant="secondary" className="absolute top-3 right-3 z-10 shadow-lg">
                {isRoadviewVisible ? "지도 보기" : "로드뷰 보기"}
            </Button>
        )}
      </div>
    </div>
  );
}
