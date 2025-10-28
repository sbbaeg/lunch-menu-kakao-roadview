
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [words, setWords] = useState<ProfanityWord[]>([]);
    const [newWord, setNewWord] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tagsToModerate, setTagsToModerate] = useState<ModerationTag[]>([]);
    const [reviewsToModerate, setReviewsToModerate] = useState<ModerationReview[]>([]);

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated' || !session?.user?.isAdmin) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                const [profanityRes, moderationRes] = await Promise.all([
                    fetch('/api/admin/profanity'),
                    fetch('/api/admin/moderation') // 새 API 호출
                ]);

                if (!profanityRes.ok) {
                    throw new Error('비속어를 불러오는 데 실패했습니다.');
                }
                const profanityData = await profanityRes.json();
                setWords(profanityData);

                if (!moderationRes.ok) {
                    throw new Error('검토 목록을 불러오는 데 실패했습니다.');
                }
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
        if (!newWord.trim()) return;
        try {
            const res = await fetch('/api/admin/profanity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: newWord }),
            });
            if (!res.ok) {
                throw new Error('단어 추가에 실패했습니다.');
            }
            const addedWord = await res.json();
            setWords([addedWord, ...words]);
            setNewWord('');
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeleteWord = async (id: number) => {
        try {
            const res = await fetch('/api/admin/profanity', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                throw new Error('단어 삭제에 실패했습니다.');
            }
            setWords(words.filter(w => w.id !== id));
        } catch (e: any) {
            setError(e.message);
        }
    };

    // --- ⬇️ 3. (임시) 액션 핸들러 추가 ⬇️ ---
    // (기능은 다음 단계에서 구현합니다)
    const handleEditItem = (type: 'tag' | 'review', id: number) => {
        alert(`[구현 필요] ${type} #${id} 수정`);
    };
    
    const handleDeleteItem = (type: 'tag' | 'review', id: number) => {
        alert(`[구현 필요] ${type} #${id} 삭제`);
    };
    
    const handleBanUser = (userId: string, userName: string | null) => {
        alert(`[구현 필요] 사용자 ${userName}(${userId}) 차단`);
    };
    // --- ⬆️ 3. (임시) 액션 핸들러 추가 ⬆️ ---

    if (status === 'loading' || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!session?.user?.isAdmin) {
        return null; // 리디렉션 중에는 아무것도 표시하지 않음
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
            
            {error && <p className="text-red-500 mb-4">오류: {error}</p>}

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>비속어 단어 관리</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input 
                            type="text"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="추가할 단어 입력..."
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                        />
                        <Button onClick={handleAddWord}>추가</Button>
                    </div>

                    <div className="space-y-2">
                        {words.map(word => (
                            <div key={word.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span>{word.word}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteWord(word.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
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
        </main>
    );
}
