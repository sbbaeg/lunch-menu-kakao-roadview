
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminEditDialog } from '@/components/ui/AdminEditDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ... (interface definitions remain the same) ...
interface ProfanityWord {
    id: number;
    word: string;
    createdAt: string;
}

interface ModerationUser {
    id: string;
    name: string | null;
    email: string | null;
}
interface ModerationTag {
    id: number;
    name: string;
    user: ModerationUser;
}
interface ModerationReview {
    id: number;
    text: string | null;
    rating: number;
    user: ModerationUser;
    restaurant: {
        id: number;
        placeName: string;
    };
}

type ItemToEdit = { type: 'tag' | 'review'; id: number; text: string; } | null;
type ItemToDelete = { type: 'tag' | 'review'; id: number; } | null;


export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [words, setWords] = useState<ProfanityWord[]>([]);
    const [newWord, setNewWord] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tagsToModerate, setTagsToModerate] = useState<ModerationTag[]>([]);
    const [reviewsToModerate, setReviewsToModerate] = useState<ModerationReview[]>([]);

    const [itemToEdit, setItemToEdit] = useState<ItemToEdit>(null);
    const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated' || !session?.user?.isAdmin) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [profanityRes, moderationRes] = await Promise.all([
                    fetch('/api/admin/profanity'),
                    fetch('/api/admin/moderation')
                ]);

                if (!profanityRes.ok) throw new Error('비속어를 불러오는 데 실패했습니다.');
                const profanityData = await profanityRes.json();
                setWords(profanityData);

                if (!moderationRes.ok) throw new Error('검토 목록을 불러오는 데 실패했습니다.');
                const moderationData = await moderationRes.json();
                setTagsToModerate(moderationData.tags);
                setReviewsToModerate(moderationData.reviews);

            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [session, status, router]);

    const handleAddWord = async () => {
        // ... (same as before)
    };

    const handleDeleteWord = async (id: number) => {
        // ... (same as before)
    };

    const handleEditItem = (type: 'tag' | 'review', id: number) => {
        if (type === 'tag') {
            const tag = tagsToModerate.find(t => t.id === id);
            if (tag) setItemToEdit({ type, id, text: tag.name });
        } else {
            const review = reviewsToModerate.find(r => r.id === id);
            if (review) setItemToEdit({ type, id, text: review.text || '' });
        }
    };

    const handleSaveItem = async (newText: string) => {
        if (!itemToEdit) return;
        const { type, id } = itemToEdit;
        const url = `/api/admin/moderation/${type}s/${id}`;
        const body = type === 'tag' ? { name: newText } : { text: newText };

        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '저장에 실패했습니다.');
            }

            if (type === 'tag') {
                setTagsToModerate(tags => tags.filter(t => t.id !== id));
            } else {
                setReviewsToModerate(reviews => reviews.filter(r => r.id !== id));
            }
            setItemToEdit(null);

        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeleteItem = (type: 'tag' | 'review', id: number) => {
        setItemToDelete({ type, id });
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        const url = `/api/admin/moderation/${type}s/${id}`;

        try {
            const res = await fetch(url, { method: 'DELETE' });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '삭제에 실패했습니다.');
            }

            if (type === 'tag') {
                setTagsToModerate(tags => tags.filter(t => t.id !== id));
            } else {
                setReviewsToModerate(reviews => reviews.filter(r => r.id !== id));
            }
            setItemToDelete(null);

        } catch (e: any) {
            setError(e.message);
        }
    };
    
    const handleBanUser = (userId: string, userName: string | null) => {
        alert(`[구현 필요] 사용자 ${userName}(${userId}) 차단`);
    };

    if (status === 'loading' || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!session?.user?.isAdmin) {
        return null;
    }

    return (
        <>
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
                
                {error && <p className="text-red-500 mb-4" onClick={() => setError(null)}>오류: {error} (클릭하여 닫기)</p>}

                {/* 비속어 관리 카드 ... (same as before) */}

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            검토가 필요한 태그
                            <Badge variant="destructive">{tagsToModerate.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tagsToModerate.length === 0 ? (
                                <p className="text-muted-foreground">검토가 필요한 태그가 없습니다.</p>
                            ) : (
                                tagsToModerate.map(tag => (
                                    <div key={tag.id} className="p-3 border rounded-md">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-lg font-semibold">{tag.name}</p>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => handleEditItem('tag', tag.id)}>
                                                    <Edit className="h-4 w-4 mr-1" /> 수정
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('tag', tag.id)}>
                                                    <Trash2 className="h-4 w-4 mr-1" /> 삭제
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                                            <span>작성자: {tag.user.name} ({tag.user.email})</span>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleBanUser(tag.user.id, tag.user.name)}>
                                                <UserX className="h-4 w-4 mr-1" /> 사용자 차단
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            검토가 필요한 리뷰
                            <Badge variant="destructive">{reviewsToModerate.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {reviewsToModerate.length === 0 ? (
                                <p className="text-muted-foreground">검토가 필요한 리뷰가 없습니다.</p>
                            ) : (
                                reviewsToModerate.map(review => (
                                    <div key={review.id} className="p-3 border rounded-md">
                                        <div className="mb-2">
                                            <span className="font-semibold">음식점:</span> {review.restaurant.placeName} (별점: {review.rating}점)
                                        </div>
                                        <blockquote className="p-2 border-l-4 bg-muted text-foreground mb-2">
                                            {review.text || "(리뷰 내용 없음)"}
                                        </blockquote>
                                        <div className="flex justify-between items-center mb-2">
                                            <div/>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => handleEditItem('review', review.id)}>
                                                    <Edit className="h-4 w-4 mr-1" /> 수정
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('review', review.id)}>
                                                    <Trash2 className="h-4 w-4 mr-1" /> 삭제
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                                            <span>작성자: {review.user.name} ({review.user.email})</span>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleBanUser(review.user.id, review.user.name)}>
                                                <UserX className="h-4 w-4 mr-1" /> 사용자 차단
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>

            {itemToEdit && (
                <AdminEditDialog
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    itemType={itemToEdit.type}
                    initialText={itemToEdit.text}
                    onSave={handleSaveItem}
                />
            )}

            {itemToDelete && (
                <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                                이 작업은 되돌릴 수 없습니다. 선택한 {itemToDelete.type === 'tag' ? '태그가' : '리뷰가'} 영구적으로 삭제됩니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete}>삭제</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
