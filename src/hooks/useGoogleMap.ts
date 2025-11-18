// src/hooks/useGoogleMap.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AppRestaurant } from '@/lib/types';
import { fetchDirections } from '@/lib/googleMaps';
import { toast } from "@/components/ui/toast";

// Define Google Maps types (simplified for now, will refine as needed)
// This will be replaced by actual Google Maps types if a library is used,
// or by global window.google.maps types.
declare global {
    interface Window {
        google: any; // 타입 충돌 해결을 위해 'any' 사용. 더 나은 타입을 원하면 @types/google.maps 설치 필요
        initGoogleMap?: () => void; // delete 연산자 사용을 위해 선택적으로 변경
    }
}

interface DirectionPoint { lat: number; lng: number; }

export function useGoogleMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const markers = useRef<google.maps.Marker[]>([]);
    const polylineInstance = useRef<google.maps.Polyline | null>(null);
    const streetviewContainer = useRef<HTMLDivElement | null>(null);
    const streetviewPanorama = useRef<google.maps.StreetViewPanorama | null>(null);
    const streetviewService = useRef<google.maps.StreetViewService | null>(null);
    const isMapReady = useAppStore((state) => state.isMapReady);
    const [streetViewImageDate, setStreetViewImageDate] = useState('');
    const [userLocationMarker, setUserLocationMarker] = useState<google.maps.Marker | null>(null);

    // Map Initialization
    useEffect(() => {
        if (isMapReady && mapContainer.current && !mapInstance.current) {
            const mapOptions: google.maps.MapOptions = {
                center: { lat: 36.3504, lng: 127.3845 }, // Default center (Daejeon)
                zoom: 15, // Equivalent to Kakao's level 5
            };
            mapInstance.current = new window.google.maps.Map(mapContainer.current, mapOptions);
            setIsMapInitialized(true);
        }
    }, [isMapReady]);

    // Street View Initialization
    useEffect(() => {
        if (isMapReady && streetviewContainer.current && !streetviewPanorama.current) {
            streetviewPanorama.current = new window.google.maps.StreetViewPanorama(streetviewContainer.current, {
                position: { lat: 36.3504, lng: 127.3845 }, // Default position
                pov: { heading: 270, pitch: 0 },
                zoom: 1,
            });
            streetviewService.current = new window.google.maps.StreetViewService();
        }
    }, [isMapReady]);

    const displayMarkers = useCallback((places: AppRestaurant[]) => {
        if (!mapInstance.current) return;
        markers.current.forEach((marker) => marker.setMap(null)); // Clear existing markers
        markers.current = [];

        const newMarkers = places.map((place) => {
            const marker = new window.google.maps.Marker({
                position: { lat: Number(place.y), lng: Number(place.x) },
                map: mapInstance.current,
                title: place.placeName, // Fix: place_name -> placeName
            });
            return marker;
        });
        markers.current = newMarkers;
    }, []);

    const drawUserLocationMarker = useCallback((lat: number, lng: number) => {
        if (!mapInstance.current) return;

        if (userLocationMarker) {
            userLocationMarker.setMap(null); // Clear existing user location marker
        }

        const newUserMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance.current,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4', // Google Blue
                fillOpacity: 1,
                strokeColor: '#FFFFFF', // White border
                strokeWeight: 2,
                scale: 8, // Size of the circle
            },
            title: '내 위치',
            zIndex: 1000, // Ensure it's on top
        });
        setUserLocationMarker(newUserMarker);
    }, [mapInstance, userLocationMarker]);

    const setCenter = useCallback((lat: number, lng: number) => {
        if (!mapInstance.current) return;
        mapInstance.current.setCenter({ lat, lng });
    }, []);

    const setZoom = useCallback((zoom: number) => {
        if (!mapInstance.current) return;
        mapInstance.current.setZoom(zoom);
    }, []);

    const drawPolyline = useCallback((encodedPath: string) => {
        if (!mapInstance.current || !window.google?.maps?.geometry?.encoding) return;
        if (polylineInstance.current) polylineInstance.current.setMap(null);

        const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPath);
        polylineInstance.current = new window.google.maps.Polyline({
            path: decodedPath,
            strokeColor: "#007BFF",
            strokeWeight: 6,
            strokeOpacity: 0.8,
            map: mapInstance.current,
        });
    }, []);

    const drawFallbackLine = useCallback((origin: { lat: number, lng: number }, destination: { lat: number, lng: number }) => {
        if (!mapInstance.current) return;
        if (polylineInstance.current) polylineInstance.current.setMap(null);

        polylineInstance.current = new window.google.maps.Polyline({
            path: [origin, destination],
            strokeColor: "#FF0000", // 빨간색으로 표시하여 실제 경로가 아님을 나타냄
            strokeWeight: 3,
            strokeOpacity: 0.6,
            map: mapInstance.current,
            geodesic: true, // 구의 대원(Great Circle)을 따라 그립니다.
        });
    }, []);

    const displayStreetView = useCallback((position: { lat: number, lng: number }) => {
        if (!streetviewService.current || !streetviewPanorama.current) {
            console.warn("Street View objects not ready.");
            return;
        }

        const latLng = new window.google.maps.LatLng(position.lat, position.lng);
        streetviewService.current.getPanorama({ location: latLng, radius: 50 }, (data: google.maps.StreetViewPanoramaData | null, status: google.maps.StreetViewStatus) => {
            if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano && data?.location?.latLng) {
                streetviewPanorama.current?.setPano(data.location.pano);
                streetviewPanorama.current?.setPosition(data.location.latLng);
                setStreetViewImageDate(data.imageDate || '');
            } else {
                toast({
                    variant: "destructive",
                    description: "해당 위치에 스트리트뷰 정보가 없습니다.",
                });
                console.error("Street View data not found for this location:", status);
                setStreetViewImageDate('');
            }
        });
    }, [toast]);

    const clearOverlays = useCallback(() => {
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        if (polylineInstance.current) {
            polylineInstance.current.setMap(null);
            polylineInstance.current = null;
        }
        if (userLocationMarker) {
            userLocationMarker.setMap(null);
            setUserLocationMarker(null);
        }
    }, [userLocationMarker]);

    const relayout = useCallback(() => {
        // Google Maps usually handles relayout automatically.
        // If map size changes, trigger resize event.
        window.google.maps.event.trigger(mapInstance.current, 'resize');
        // For Street View, if it's visible, it might also need a resize.
        // streetviewPanorama.current?.setVisible(true); // This might trigger a relayout
    }, []);

    return {
        isMapReady, // This comes from useAppStore, indicating Google Maps script is loaded
        isMapInitialized,
        mapContainerRef: mapContainer,
        mapInstance: mapInstance.current,
        streetviewContainerRef: streetviewContainer,
        streetviewPanorama: streetviewPanorama.current,
        displayMarkers,
        setCenter,
        setZoom, // Renamed from setLevel
        drawPolyline,
        drawFallbackLine,
        drawUserLocationMarker,
        clearOverlays,
        displayStreetView, // Renamed from displayRoadview
        relayout,
        streetViewImageDate,
    };
}
