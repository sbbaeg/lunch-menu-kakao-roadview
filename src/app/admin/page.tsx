
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface ProfanityWord {
    id: number;
    word: string;
    createdAt: string;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [words, setWords] = useState<ProfanityWord[]>([]);
    const [newWord, setNewWord] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated' || !session?.user?.isAdmin) {
            router.push('/'); // 관리자가 아니면 메인 페이지로 리디렉션
            return;
        }

        const fetchWords = async () => {
            try {
                const res = await fetch('/api/admin/profanity');
                if (!res.ok) {
                    throw new Error('비속어를 불러오는 데 실패했습니다.');
                }
                const data = await res.json();
                setWords(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWords();
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

            {/* 여기에 다른 관리자 기능을 추가할 수 있습니다. */}
        </main>
    );
}
