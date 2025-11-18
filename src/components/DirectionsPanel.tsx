// src/components/DirectionsPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { AppRestaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Bus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from '@/store/useAppStore';
import { DirectionsDisplay } from './DirectionsDisplay';
import { Skeleton } from './ui/skeleton';

interface DirectionsPanelProps {
    restaurant: AppRestaurant;
}

export function DirectionsPanel({ restaurant }: DirectionsPanelProps) {
    const [travelMode, setTravelMode] = useState('WALK');
    const userLocation = useAppStore((state) => state.userLocation);
    const getDirections = useAppStore((state) => state.getDirections);
    const directions = useAppStore((state) => state.directions);
    const clearDirections = useAppStore((state) => state.clearDirections);
    const isLoadingDirections = useAppStore((state) => state.isLoadingDirections);

    useEffect(() => {
        // Clear previous directions when component mounts or restaurant changes
        clearDirections();
    }, [restaurant, clearDirections]);

    useEffect(() => {
        if (userLocation && restaurant.y && restaurant.x) {
            const origin = `${userLocation.lat},${userLocation.lng}`;
            const destination = `${restaurant.y},${restaurant.x}`;
            getDirections(origin, destination, travelMode);
        }
    }, [travelMode, restaurant, userLocation, getDirections]);

    if (!userLocation) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                사용자 위치를 먼저 설정해주세요.
            </div>
        );
    }

    return (
        <div className="p-4 bg-muted/50">
            <Tabs value={travelMode} onValueChange={setTravelMode} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="DRIVE" className="flex items-center gap-2">
                        <Car className="h-4 w-4" /> 자동차
                    </TabsTrigger>
                    <TabsTrigger value="TRANSIT" className="flex items-center gap-2">
                        <Bus className="h-4 w-4" /> 대중교통
                    </TabsTrigger>
                    <TabsTrigger value="WALK" className="flex items-center gap-2">
                        <Footprints className="h-4 w-4" /> 도보
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            {isLoadingDirections ? (
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <DirectionsDisplay directions={directions} />
            )}
        </div>
    );
}
