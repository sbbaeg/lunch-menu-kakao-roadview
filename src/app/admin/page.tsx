
"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Edit, UserX, Users, Utensils, MessageSquare, Tag, ThumbsUp, GitCompareArrows, Search } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

// --- TYPE DEFINITIONS ---
interface ProfanityWord { id: number; word: string; }
interface ModerationUser { id: string; name: string | null; email: string | null; }
interface ModerationTag { id: number; name: string; user: ModerationUser; }
interface ModerationReview { id: number; text: string | null; rating: number; user: ModerationUser; restaurant: { id: number; placeName: string; }; }
interface TimeSeriesData { date: string; users?: number; reviews?: number; }
interface AdminStats {
    totals: { users: number; restaurants: number; reviews: number; tags: number; restaurantVotes: number; reviewVotes: number; };
    timeSeries: { dailyNewUsers: TimeSeriesData[]; dailyNewReviews: TimeSeriesData[]; };
}
interface UserForManagement {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin: boolean;
    isBanned: boolean;
}
type ItemToEdit = { type: 'tag' | 'review'; id: number; text: string; } | null;
type ItemToDelete = { type: 'tag' | 'review'; id: number; } | null;
type ActiveChart = 'users' | 'reviews';

// --- CHILD COMPONENTS ---
const StatCard = ({ title, value, icon, onClick, isActive }: { title: string; value: number | string; icon: ReactNode; onClick?: () => void; isActive?: boolean; }) => (
    <Card onClick={onClick} className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const DashboardChart = ({ data, dataKey, title }: { data: TimeSeriesData[]; dataKey: 'users' | 'reviews'; title: string; }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(str) => new Date(str).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // State
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [words, setWords] = useState<ProfanityWord[]>([]);
    const [newWord, setNewWord] = useState('');
    const [tagsToModerate, setTagsToModerate] = useState<ModerationTag[]>([]);
    const [reviewsToModerate, setReviewsToModerate] = useState<ModerationReview[]>([]);
    const [itemToEdit, setItemToEdit] = useState<ItemToEdit>(null);
    const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);
    const [activeChart, setActiveChart] = useState<ActiveChart>('users');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserForManagement[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [bannedUsers, setBannedUsers] = useState<UserForManagement[]>([]);
    const [bannedUserSearchTerm, setBannedUserSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<UserForManagement[]>([]);
    const [filteredBannedUsers, setFilteredBannedUsers] = useState<UserForManagement[]>([]);

    // Initial Data Fetching
    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated' || !session?.user?.isAdmin) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [profanityRes, moderationRes, statsRes, usersRes, bannedUsersRes] = await Promise.all([
                    fetch('/api/admin/profanity'),
                    fetch('/api/admin/moderation'),
                    fetch('/api/admin/stats'),
                    fetch('/api/admin/users?isBanned=false'),
                    fetch('/api/admin/users?isBanned=true')
                ]);

                if (!profanityRes.ok) throw new Error('비속어를 불러오는 데 실패했습니다.');
                setWords(await profanityRes.json());

                if (!moderationRes.ok) throw new Error('검토 목록을 불러오는 데 실패했습니다.');
                const moderationData = await moderationRes.json();
                setTagsToModerate(moderationData.tags);
                setReviewsToModerate(moderationData.reviews);

                if (!statsRes.ok) throw new Error('통계 정보를 불러오는 데 실패했습니다.');
                setStats(await statsRes.json());

                if (!usersRes.ok) throw new Error('사용자 목록을 불러오는 데 실패했습니다.');
                const usersData = await usersRes.json();
                console.log('All Users from API:', usersData);
                setUsers(usersData);

                if (!bannedUsersRes.ok) throw new Error('차단된 사용자 목록을 불러오는 데 실패했습니다.');
                const bannedUsersData = await bannedUsersRes.json();
                console.log('Banned Users from API:', bannedUsersData);
                setBannedUsers(bannedUsersData);

            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [session, status, router]);

    // Client-side filtering for all users
    useEffect(() => {
        const lowercasedTerm = userSearchTerm.toLowerCase();
        const filtered = users.filter(user => 
            (user.name?.toLowerCase().includes(lowercasedTerm)) || 
            (user.email?.toLowerCase().includes(lowercasedTerm))
        );
        setFilteredUsers(filtered);
    }, [userSearchTerm, users]);

    // Client-side filtering for banned users
    useEffect(() => {
        const lowercasedTerm = bannedUserSearchTerm.toLowerCase();
        const filtered = bannedUsers.filter(user => 
            (user.name?.toLowerCase().includes(lowercasedTerm)) || 
            (user.email?.toLowerCase().includes(lowercasedTerm))
        );
        setFilteredBannedUsers(filtered);
    }, [bannedUserSearchTerm, bannedUsers]);

    const handleAddWord = async () => {
        if (!newWord.trim()) return;
        try {
            const res = await fetch('/api/admin/profanity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: newWord }),
            });
            if (!res.ok) throw new Error('단어 추가에 실패했습니다.');
            const addedWord = await res.json();
            setWords([addedWord, ...words]);
            setNewWord('');
        } catch (e: any) { setError(e.message); }
    };

    const handleDeleteWord = async (id: number) => {
        try {
            const res = await fetch('/api/admin/profanity', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('단어 삭제에 실패했습니다.');
            setWords(words.filter(w => w.id !== id));
        } catch (e: any) { setError(e.message); }
    };

    const handleEditItem = (type: 'tag' | 'review', id: number, currentText: string) => {
        setItemToEdit({ type, id, text: currentText });
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
        } catch (e: any) { setError(e.message); }
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
        } catch (e: any) { setError(e.message); }
    };

    const handleUnbanUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'isBanned', status: false }),
            });
            if (!res.ok) throw new Error('사용자 차단 해제에 실패했습니다.');
            const unbannedUser = bannedUsers.find(u => u.id === userId);
            if (unbannedUser) {
                setBannedUsers(bannedUsers.filter(u => u.id !== userId));
                setUsers([unbannedUser, ...users]);
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    if (status === 'loading' || isLoading) {
        return <div className="p-8"><Skeleton className="h-screen w-full"/></div>;
    }
    if (!session?.user?.isAdmin) {
        return null;
    }

    return (
        <>
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
                
                <Tabs defaultValue="dashboard">
                    <TabsList className="mb-4">
                        <TabsTrigger value="dashboard">대시보드</TabsTrigger>
                        <TabsTrigger value="management">콘텐츠 관리</TabsTrigger>
                        <TabsTrigger value="users">사용자 관리</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard">
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <StatCard title="총 사용자" value={stats?.totals.users ?? '-'} icon={<Users className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('users')} isActive={activeChart === 'users'} />
                                <StatCard title="총 리뷰" value={stats?.totals.reviews ?? '-'} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('reviews')} isActive={activeChart === 'reviews'} />
                                <StatCard title="총 음식점" value={stats?.totals.restaurants ?? '-'} icon={<Utensils className="h-4 w-4 text-muted-foreground" />} />
                                <StatCard title="총 태그" value={stats?.totals.tags ?? '-'} icon={<Tag className="h-4 w-4 text-muted-foreground" />} />
                                <StatCard title="음식점 투표" value={stats?.totals.restaurantVotes ?? '-'} icon={<ThumbsUp className="h-4 w-4 text-muted-foreground" />} />
                                <StatCard title="리뷰 투표" value={stats?.totals.reviewVotes ?? '-'} icon={<GitCompareArrows className="h-4 w-4 text-muted-foreground" />} />
                            </div>
                            {stats && activeChart === 'users' && <DashboardChart data={stats.timeSeries.dailyNewUsers} dataKey="users" title="신규 사용자 (지난 30일)" />}
                            {stats && activeChart === 'reviews' && <DashboardChart data={stats.timeSeries.dailyNewReviews} dataKey="reviews" title="신규 리뷰 (지난 30일)" />}
                        </div>
                    </TabsContent>

                    <TabsContent value="management">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2">검토가 필요한 태그<Badge variant="destructive">{tagsToModerate.length}</Badge></CardTitle></CardHeader>
                                    <CardContent className="max-h-96 overflow-y-auto">
                                        {tagsToModerate.length === 0 
                                            ? <p className="text-sm text-muted-foreground">검토가 필요한 태그가 없습니다.</p>
                                            : tagsToModerate.map(tag => (
                                                <div key={tag.id} className="p-3 border rounded-md mb-3 text-sm">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="font-semibold truncate">{tag.name}</p>
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <Button variant="outline" size="sm" onClick={() => handleEditItem('tag', tag.id, tag.name)}><Edit className="h-3 w-3" /></Button>
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('tag', tag.id)}><Trash2 className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex justify-between items-center">
                                                        <Link href={`/admin/users/${tag.user.id}`} className="truncate hover:underline">
                                                            by {tag.user.name} ({tag.user.email})
                                                        </Link>
                                                        <Button variant="ghost" size="sm" className="text-red-500 h-auto p-0" onClick={() => router.push(`/admin/users/${tag.user.id}`)}><UserX className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2">검토가 필요한 리뷰<Badge variant="destructive">{reviewsToModerate.length}</Badge></CardTitle></CardHeader>
                                    <CardContent className="max-h-96 overflow-y-auto">
                                        {reviewsToModerate.length === 0
                                            ? <p className="text-sm text-muted-foreground">검토가 필요한 리뷰가 없습니다.</p>
                                            : reviewsToModerate.map(review => (
                                                <div key={review.id} className="p-3 border rounded-md mb-3 text-sm">
                                                    <div className="mb-2">
                                                        <span className="font-semibold">음식점:</span> {review.restaurant.placeName} (별점: {review.rating}점)
                                                    </div>
                                                    <blockquote className="p-2 border-l-4 bg-muted/50 text-foreground mb-2 text-xs">
                                                        {review.text || "(리뷰 내용 없음)"}
                                                    </blockquote>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div/>
                                                        <div className="flex gap-1">
                                                            <Button variant="outline" size="sm" onClick={() => handleEditItem('review', review.id, review.text || '')}><Edit className="h-3 w-3" /></Button>
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('review', review.id)}><Trash2 className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex justify-between items-center">
                                                        <Link href={`/admin/users/${review.user.id}`} className="truncate hover:underline">
                                                            by {review.user.name} ({review.user.email})
                                                        </Link>
                                                        <Button variant="ghost" size="sm" className="text-red-500 h-auto p-0" onClick={() => router.push(`/admin/users/${review.user.id}`)}><UserX className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </CardContent>
                                </Card>
                            </div>
                            <Card className="lg:col-span-1">
                                <CardHeader><CardTitle>비속어 단어 관리</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-4">
                                        <Input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="추가할 단어..." onKeyDown={(e) => e.key === 'Enter' && handleAddWord()} />
                                        <Button onClick={handleAddWord}>추가</Button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                                        {words.map(word => (
                                            <div key={word.id} className="flex items-center justify-between p-2 border rounded-md">
                                                <span className="text-sm">{word.word}</span>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteWord(word.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>전체 사용자</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            type="text"
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            placeholder="이름 또는 이메일로 검색..."
                                        />
                                    </div>
                                    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                                        {filteredUsers.map(user => (
                                            <div key={user.id} className="p-3 border rounded-md flex justify-between items-center">
                                                <div>
                                                    <Link href={`/admin/users/${user.id}`} className="font-semibold truncate hover:underline">
                                                        {user.name || '이름 없음'}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${user.id}`)}>상세보기</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>차단된 사용자</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            type="text"
                                            value={bannedUserSearchTerm}
                                            onChange={(e) => setBannedUserSearchTerm(e.target.value)}
                                            placeholder="차단된 사용자 검색..."
                                        />
                                    </div>
                                    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                                        {filteredBannedUsers.map(user => (
                                            <div key={user.id} className="p-3 border rounded-md flex justify-between items-center">
                                                <div>
                                                    <Link href={`/admin/users/${user.id}`} className="font-semibold truncate hover:underline">
                                                        {user.name || '이름 없음'}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>차단 해제</Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </Tabs>
            </main>

            {itemToEdit && <AdminEditDialog isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} itemType={itemToEdit.type} initialText={itemToEdit.text} onSave={handleSaveItem} />}
            {itemToDelete && (
                <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다. 선택한 항목이 영구적으로 삭제됩니다.</AlertDialogDescription>
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
