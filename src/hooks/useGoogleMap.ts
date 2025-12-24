import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

export function useGoogleMap(
    hoveredRestaurantId: string | null,
    setHoveredRestaurantId: (id: string | null) => void,
    setSelectedItemId: (id: string) => void
) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const markers = useRef<google.maps.Marker[]>([]);
    const directionsPolyline = useRef<google.maps.Polyline | null>(null);
    const streetviewContainer = useRef<HTMLDivElement | null>(null);
    const streetviewPanorama = useRef<google.maps.StreetViewPanorama | null>(null);
    const streetviewService = useRef<google.maps.StreetViewService | null>(null);
    const isMapReady = useAppStore((state) => state.isMapReady);
    const [streetViewImageDate, setStreetViewImageDate] = useState('');
    const userLocationMarker = useRef<google.maps.Marker | null>(null);

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
        if (!mapInstance.current || !window.google) return;

        const defaultMarkerIcon = {
            path: 'M 12 2 C 8.13 2 5 5.13 5 9 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.87 -3.13 -7 -7 -7 Z',
            fillColor: '#FF0000', // Red
            fillOpacity: 0.9,
            strokeWeight: 0,
            rotation: 0,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 24)
        };
    
        const hoveredMarkerIcon = {
            path: 'M 12 2 C 8.13 2 5 5.13 5 9 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.87 -3.13 -7 -7 -7 Z',
            fillColor: '#0000FF', // Blue
            fillOpacity: 1.0,
            strokeWeight: 0,
            rotation: 0,
            scale: 2.0,
            anchor: new window.google.maps.Point(12, 24)
        };

        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];

        const newMarkers = places.map((place) => {
            const isHovered = place.id === hoveredRestaurantId;
            const marker = new window.google.maps.Marker({
                position: { lat: Number(place.y), lng: Number(place.x) },
                map: mapInstance.current,
                title: place.placeName,
                icon: isHovered ? hoveredMarkerIcon : defaultMarkerIcon,
                zIndex: isHovered ? 2 : 1, // Bring hovered marker to front
            });

            marker.addListener('mouseover', () => {
                setHoveredRestaurantId(place.id);
            });
            marker.addListener('mouseout', () => {
                setHoveredRestaurantId(null);
            });

            marker.addListener('click', () => {
                setSelectedItemId(place.id);
            });

            return marker;
        });
        markers.current = newMarkers;
    }, [mapInstance, hoveredRestaurantId, setHoveredRestaurantId, setSelectedItemId]);


    const drawUserLocationMarker = useCallback((lat: number, lng: number) => {
        if (!mapInstance.current) return;

        if (userLocationMarker.current) {
            userLocationMarker.current.setMap(null); // Clear existing user location marker
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
        userLocationMarker.current = newUserMarker;
    }, []);

    const setCenter = useCallback((lat: number, lng: number) => {
        if (!mapInstance.current) return;
        mapInstance.current.setCenter({ lat, lng });
    }, []);

    const setZoom = useCallback((zoom: number) => {
        if (!mapInstance.current) return;
        mapInstance.current.setZoom(zoom);
    }, []);

    const drawDirections = useCallback((directionsResult: any) => {
        if (!mapInstance.current || !window.google?.maps?.geometry?.encoding) return;
        if (directionsPolyline.current) {
            directionsPolyline.current.setMap(null);
        }

        const encodedPath = directionsResult.route?.polyline?.encodedPolyline || directionsResult.path_encoded;

        if (!encodedPath) {
            console.error("No encoded polyline found in directions result");
            return;
        }

        const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPath);
        
        directionsPolyline.current = new window.google.maps.Polyline({
            path: decodedPath,
            strokeColor: "#007BFF",
            strokeWeight: 6,
            strokeOpacity: 0.8,
            map: mapInstance.current,
        });

        if (directionsResult.route?.legs) {
            const bounds = new window.google.maps.LatLngBounds();
            directionsResult.route.legs.forEach((leg: any) => {
                leg.steps.forEach((step: any) => {
                    bounds.extend(new window.google.maps.LatLng(step.startLocation.latLng.latitude, step.startLocation.latLng.longitude));
                    bounds.extend(new window.google.maps.LatLng(step.endLocation.latLng.latitude, step.endLocation.latLng.longitude));
                });
            });
            mapInstance.current.fitBounds(bounds, 100); // 100px padding
        }

    }, []);

    const drawStraightLine = useCallback((origin: { lat: number, lng: number }, destination: { lat: number, lng: number }) => {
        if (!mapInstance.current) return;
        if (directionsPolyline.current) directionsPolyline.current.setMap(null);

        const lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4,
        };

        directionsPolyline.current = new window.google.maps.Polyline({
            path: [origin, destination],
            strokeColor: "#007BFF",
            strokeOpacity: 0,
            strokeWeight: 2,
            icons: [{
                icon: lineSymbol,
                offset: '0',
                repeat: '20px'
            }],
            map: mapInstance.current,
            geodesic: true,
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
                toast.error("해당 위치에 스트리트뷰 정보가 없습니다.");
                console.error("Street View data not found for this location:", status);
                setStreetViewImageDate('');
            }
        });
    }, []);

    const clearDirections = useCallback(() => {
        if (directionsPolyline.current) {
            directionsPolyline.current.setMap(null);
            directionsPolyline.current = null;
        }
    }, []);

    const clearOverlays = useCallback(() => {
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        if (directionsPolyline.current) {
            directionsPolyline.current.setMap(null);
            directionsPolyline.current = null;
        }
        if (userLocationMarker.current) {
            userLocationMarker.current.setMap(null);
            userLocationMarker.current = null;
        }
    }, []);

    const relayout = useCallback(() => {
        if (!window.google?.maps?.event || !mapInstance.current) return;
        // Google Maps usually handles relayout automatically.
        // If map size changes, trigger resize event.
        window.google.maps.event.trigger(mapInstance.current, 'resize');
        // For Street View, if it's visible, it might also need a resize.
        // streetviewPanorama.current?.setVisible(true); // This might trigger a relayout
    }, []);

    const memoizedValue = useMemo(() => ({
        isMapReady,
        isMapInitialized,
        mapContainerRef: mapContainer,
        mapInstance: mapInstance.current,
        streetviewContainerRef: streetviewContainer,
        streetviewPanorama: streetviewPanorama.current,
        displayMarkers,
        setCenter,
        setZoom,
        drawDirections,
        drawStraightLine,
        drawUserLocationMarker,
        clearDirections,
        clearOverlays,
        displayStreetView,
        relayout,
        streetViewImageDate,
    }), [
        isMapReady, isMapInitialized, displayMarkers, setCenter, setZoom,
        drawDirections, drawStraightLine, drawUserLocationMarker, clearDirections,
        clearOverlays, displayStreetView, relayout, streetViewImageDate,
        mapInstance.current, streetviewPanorama.current,
        hoveredRestaurantId, setHoveredRestaurantId, setSelectedItemId,
    ]);

    return memoizedValue;
}