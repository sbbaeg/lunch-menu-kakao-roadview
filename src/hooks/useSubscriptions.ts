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

    return { subscribedTagIds };
}