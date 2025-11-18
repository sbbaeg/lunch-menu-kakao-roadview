import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppRestaurant } from '@/lib/types';
import { toast } from "@/components/ui/toast";

export function useBlacklist() {
    const { status } = useSession();
    const [blacklist, setBlacklist] = useState<AppRestaurant[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const loadBlacklist = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/blacklist');
                    if (response.ok) {
                        const data = await response.json();
                        setBlacklist(data);
                    }
                } catch (error) {
                    console.error('블랙리스트 로딩 중 오류:', error);
                }
            } else {
                setBlacklist([]);
            }
        };

        if (isMounted) {
            loadBlacklist();
        }
    }, [status, isMounted]);

    const isBlacklisted = (placeId: string) => blacklist.some((item) => item.id === placeId);

    const toggleBlacklist = async (place: AppRestaurant) => {
        if (status !== 'authenticated') {
            toast({
                variant: "destructive",
                description: "로그인이 필요한 기능입니다.",
            });
            return;
        }

        const originalBlacklist = blacklist;
        const isCurrentlyBlacklisted = isBlacklisted(place.id);
        const newBlacklist = isCurrentlyBlacklisted
            ? blacklist.filter((item) => item.id !== place.id)
            : [...blacklist, place];
        setBlacklist(newBlacklist);

        try {
            const response = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(place),
            });

            if (!response.ok) {
                setBlacklist(originalBlacklist);
                toast({
                    variant: "destructive",
                    description: "블랙리스트 처리에 실패했습니다.",
                });
            }
        } catch (error) {
            setBlacklist(originalBlacklist);
            toast({
                variant: "destructive",
                description: "블랙리스트 처리에 실패했습니다.",
            });
        }
    };

    return { blacklist, isBlacklisted, toggleBlacklist };
}