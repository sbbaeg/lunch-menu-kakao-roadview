import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tag } from '@/lib/types';
import { toast } from "@/components/ui/toast";

export function useUserTags() {
    const { status } = useSession();
    const [userTags, setUserTags] = useState<Tag[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const loadUserTags = async () => {
            if (status === 'authenticated') {
                try {
                    const response = await fetch('/api/tags');
                    if (response.ok) {
                        const data = await response.json();
                        setUserTags(data);
                    }
                } catch (error) {
                    console.error('사용자 태그 로딩 중 오류:', error);
                }
            } else {
                setUserTags([]);
            }
        };

        if (isMounted) {
            loadUserTags();
        }
    }, [status, isMounted]);

    const createTag = async (name: string): Promise<Tag | null> => { // ✅ 반환 타입을 명시해줍니다.
        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                const newTag = await response.json();
                setUserTags(prevTags => [...prevTags, newTag]);
                return newTag; // ✅ 성공 시 생성된 태그 객체를 반환합니다.
            } else {
                const data = await response.json();
                toast({
                    variant: "destructive",
                    description: data.error || "태그 생성에 실패했습니다.",
                });
                return null; // ✅ 실패 시 null을 반환합니다.
            }
        } catch (error) {
            toast({
                variant: "destructive",
                description: "태그 생성 중 오류가 발생했습니다.",
            });
            return null; // ✅ 실패 시 null을 반환합니다.
        }
    };

    const deleteTag = async (tagId: number) => {
        const originalTags = userTags;
        setUserTags(userTags.filter(tag => tag.id !== tagId));
        try {
            const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
            if (!response.ok) {
                setUserTags(originalTags);
                toast({
                    variant: "destructive",
                    description: "태그 삭제에 실패했습니다.",
                });
            }
        } catch (error) {
            setUserTags(originalTags);
            toast({
                variant: "destructive",
                description: "태그 삭제 중 오류가 발생했습니다.",
            });
        }
    };

    const toggleTagPublic = async (tagId: number) => {
        const originalTags = userTags;
        setUserTags(prevTags =>
            prevTags.map(tag =>
                tag.id === tagId ? { ...tag, isPublic: !tag.isPublic } : tag
            )
        );
        try {
            const response = await fetch(`/api/tags/${tagId}/toggle-public`, { method: 'PATCH' });
            if (!response.ok) {
                setUserTags(originalTags);
                toast({
                    variant: "destructive",
                    description: "상태 변경에 실패했습니다.",
                });
            }
        } catch (error) {
            setUserTags(originalTags);
            toast({
                variant: "destructive",
                description: "상태 변경 중 오류가 발생했습니다.",
            });
        }
    };

    return { userTags, createTag, deleteTag, toggleTagPublic };
}