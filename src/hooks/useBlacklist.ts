import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Restaurant } from '@/lib/types';

export function useBlacklist() {
    const { status } = useSession();
    const [blacklist, setBlacklist] = useState<Restaurant[]>([]);

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

        loadBlacklist();
    }, [status]);

    const isBlacklisted = (placeId: string) => blacklist.some((item) => item.id === placeId);

    const toggleBlacklist = async (place: Restaurant) => {
        if (status !== 'authenticated') {
            alert("로그인이 필요한 기능입니다.");
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
                alert("블랙리스트 처리에 실패했습니다.");
            }
        } catch (error) {
            setBlacklist(originalBlacklist);
            alert("블랙리스트 처리에 실패했습니다.");
        }
    };

    return { blacklist, isBlacklisted, toggleBlacklist };
}