import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useSubscriptions() {
    const { status } = useSession();
    const [subscribedTagIds, setSubscribedTagIds] = useState<number[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fetchSubscribedTagIds = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/subscriptions');
                    if (response.ok) {
                        const data: { id: number }[] = await response.json();
                        setSubscribedTagIds(data.map(tag => tag.id));
                    }
                } catch (error) {
                    console.error("구독 태그 ID 로딩 실패:", error);
                }
            } else {
                setSubscribedTagIds([]);
            }
        };
        if (isMounted) {
            fetchSubscribedTagIds();
        }
    }, [status, isMounted]);

    const toggleSubscription = async (tagId: number) => {
        if (status !== 'authenticated') return;

        const isSubscribed = subscribedTagIds.includes(tagId);
        const originalIds = subscribedTagIds;

        // Optimistic update
        if (isSubscribed) {
            setSubscribedTagIds(ids => ids.filter(id => id !== tagId));
        } else {
            setSubscribedTagIds(ids => [...ids, tagId]);
        }

        try {
            const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
            if (!response.ok) {
                // Revert on failure
                setSubscribedTagIds(originalIds);
            }
        } catch (error) {
            console.error("Failed to toggle subscription:", error);
            // Revert on error
            setSubscribedTagIds(originalIds);
        }
    };

    return { subscribedTagIds, toggleSubscription };
}