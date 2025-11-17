// src/components/MapPanel.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { AppRestaurant } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const { isMapReady, mapContainerRef, mapInstance, streetviewContainerRef, streetviewPanorama, clearOverlays, displayMarkers, setCenter, drawDirections, displayStreetView, relayout, streetViewImageDate } = useGoogleMap();
  
  const [searchAddress, setSearchAddress] = useState("");
  const [searchMode, setSearchMode] = useState<'place' | 'food'>('place');
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [isStreetviewVisible, setStreetviewVisible] = useState(false); // Renamed from isRoadviewVisible
  const hasShownStreetViewToast = useRef(false);

  useEffect(() => {
    if (onMapReady) {
      onMapReady(isMapReady);
    }
  }, [isMapReady, onMapReady]);

  // ResizeObserver를 사용하여 컨테이너 크기 변경 시 지도 리레이아웃
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || !isMapReady) return;

    const observer = new ResizeObserver(() => {
      relayout();
    });

    observer.observe(mapContainer);

    return () => {
      observer.disconnect();
    };
  }, [isMapReady, mapContainerRef, relayout]);

  useEffect(() => {
    if (isMapReady) {
      clearOverlays();
      displayMarkers(restaurants);
    }
  }, [restaurants, isMapReady, clearOverlays, displayMarkers]);

  useEffect(() => {
    if (isMapReady && selectedRestaurant) {
        setCenter(Number(selectedRestaurant.y), Number(selectedRestaurant.x));
        displayStreetView({ lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) });
        setStreetviewVisible(false); // Renamed from setRoadviewVisible
        if (userLocation) {
            drawDirections(
                { lat: userLocation.lat, lng: userLocation.lng },
                { lat: Number(selectedRestaurant.y), lng: Number(selectedRestaurant.x) }
            );
        }
    }
}, [selectedRestaurant, userLocation, isMapReady, setCenter, displayStreetView, drawDirections]);

  useEffect(() => {
    if (!mapInstance) return;
    const handleDragEnd = () => { setShowSearchAreaButton(true); };
    const listener = window.google.maps.event.addListener(mapInstance, 'dragend', handleDragEnd);
    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, [mapInstance]);

  useEffect(() => {
    const timerId = setTimeout(() => {
        if (isStreetviewVisible) streetviewPanorama?.setVisible(true);
        const currentCenter = mapInstance?.getCenter(); // Get center once
        if (mapInstance && currentCenter) { // Check if mapInstance and currentCenter are defined
            mapInstance.setCenter(currentCenter); // Trigger map relayout
        }
    }, 10);
    return () => clearTimeout(timerId);
  }, [isStreetviewVisible, mapInstance, streetviewPanorama]);

  useEffect(() => {
    if (userLocation && !selectedRestaurant) {
      setCenter(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, selectedRestaurant, setCenter]);

  useEffect(() => {
    if (isMapReady && restaurants.length > 0 && !userLocation && !selectedRestaurant) {
      const firstRestaurant = restaurants[0];
      setCenter(Number(firstRestaurant.y), Number(firstRestaurant.x));
    }
  }, [isMapReady, restaurants, userLocation, selectedRestaurant, setCenter]);

  const handleSearch = () => {
    if (!mapInstance || !searchAddress.trim() || !window.google || !window.google.maps.places) return;

    if (searchMode === 'place') {
      const service = new window.google.maps.places.PlacesService(mapInstance);
      const request = {
        query: searchAddress,
        fields: ['geometry'], // Request geometry to get location
      };

      service.findPlaceFromQuery(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => { // Fix: Add types
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0].geometry) {
          const firstPlace = results[0];
          if (firstPlace.geometry?.location) {
            setCenter(firstPlace.geometry.location.lat(), firstPlace.geometry.location.lng());
            setShowSearchAreaButton(true); // Show the button after moving the map
          }
        } else {
          console.error('PlacesService findPlaceFromQuery failed with status:', status);
          alert(`검색 결과가 없습니다. (오류: ${status})`);
        }
      });
    } else {
      const center = mapInstance.getCenter();
      if (center) { // Fix: Check if center is defined
        onAddressSearch(searchAddress, searchMode, { lat: center.lat(), lng: center.lng() });
      }
    }
  };
  
  const handleSearchAreaClick = () => {
    if (!mapInstance) return;
    setShowSearchAreaButton(false);
    const center = mapInstance.getCenter();
    if (center) { // Fix: Check if center is defined
      onSearchInArea({ lat: center.lat(), lng: center.lng() });
    }
  }

  const handleStreetViewToggle = () => {
    if (!isStreetviewVisible && !hasShownStreetViewToast.current) {
      toast.info("스트리트뷰는 최신 정보가 아닐 수 있습니다. 더 정확한 주변 환경 정보가 필요하시면 위성 지도를 활용해 보세요.");
      hasShownStreetViewToast.current = true;
    }
    setStreetviewVisible((prev) => !prev);
  };

  return (
    <div className="w-full h-full rounded-lg border shadow-sm flex flex-col overflow-hidden">
      <div className="relative flex-1">
        {showSearchAreaButton && !hideControls && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-md">
            <Button size="lg" onClick={handleSearchAreaClick} className="bg-white text-black rounded-full hover:bg-gray-200 shadow-lg">
              이 지역에서 재검색
            </Button>
          </div>
        )}
        
        <div ref={mapContainerRef} className={`w-full h-full transition-opacity duration-300 ${isStreetviewVisible ? "opacity-0 invisible" : "opacity-100 visible"}`} />
        <div ref={streetviewContainerRef} className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${isStreetviewVisible ? "opacity-100 visible" : "opacity-0 invisible"}`} />

        {!hideControls && selectedRestaurant && (
            <Button onClick={handleStreetViewToggle} variant="secondary" className="absolute top-3 right-14 z-10 shadow-lg">
                {isStreetviewVisible ? "지도 보기" : "스트리트뷰 보기"}
            </Button>
        )}
        {isStreetviewVisible && streetViewImageDate && (
          <Badge variant="secondary" className="absolute top-3 left-3 z-10 shadow-lg">
            촬영일: {streetViewImageDate}
          </Badge>
        )}
      </div>
    </div>
  );
}
