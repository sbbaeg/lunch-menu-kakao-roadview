"use client";

import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Edit, UserX, Users, Utensils, MessageSquare, Tag, ThumbsUp, GitCompareArrows, Search, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminEditDialog } from '@/components/ui/AdminEditDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { AdminMessageDialog } from '@/components/ui/AdminMessageDialog';
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
interface TimeSeriesData {
    date: string;
    users: number;
    reviews: number;
    tags: number;
    restaurantVotes: number;
    reviewVotes: number;
}
interface AdminStats {
    totals: {
        users: number;
        reviews: number;
        tags: number;
        restaurantVotes: number;
        reviewVotes: number;
    };
    timeSeries: TimeSeriesData[];
}
interface UserForManagement {
    id: string;
    name: string | null;
    email: string | null;
    isAdmin: boolean;
    isBanned: boolean;
}
interface Inquiry {
    id: number;
    title: string;
    message: string;
    adminReply: string | null;
    isResolved: boolean;
    isFromAdmin: boolean;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
    };
}
type ItemToEdit = { type: 'tag' | 'review'; id: number; text: string; } | null;
type ItemToDelete = { type: 'tag' | 'review'; id: number; } | null;
type ActiveChart = 'users' | 'reviews' | 'tags' | 'restaurantVotes' | 'reviewVotes';

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

const DashboardChart = ({ data, dataKey, title }: { data: any[]; dataKey: string; title: string; }) => (
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

export default function AdminPageClient() {
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
    const [chartPeriod, setChartPeriod] = useState('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserForManagement[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [bannedUsers, setBannedUsers] = useState<UserForManagement[]>([]);
    const [bannedUserSearchTerm, setBannedUserSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<UserForManagement[]>([]);
    const [filteredBannedUsers, setFilteredBannedUsers] = useState<UserForManagement[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [inquiryFilter, setInquiryFilter] = useState<'unresolved' | 'resolved' | 'admin-sent'>('unresolved');
    const [replyingInquiry, setReplyingInquiry] = useState<Inquiry | null>(null);
    const [replyText, setReplyText] = useState('');
    const [messagingUser, setMessagingUser] = useState<UserForManagement | null>(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const fetchInquiries = useCallback(async () => {
        try {
            const inquiriesRes = await fetch('/api/admin/inquiries');
            if (inquiriesRes.ok) {
                setInquiries(await inquiriesRes.json());
            }
        } catch (e) {
            console.error("Failed to poll inquiries", e);
        }
    }, []);

    // Initial Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [profanityRes, moderationRes, statsRes, usersRes, bannedUsersRes] = await Promise.all([
                    fetch('/api/admin/profanity'),
                    fetch('/api/admin/moderation'),
                    fetch('/api/admin/stats'),
                    fetch('/api/admin/users?isBanned=false'),
                    fetch('/api/admin/users?isBanned=true'),
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
                setUsers(await usersRes.json());

                if (!bannedUsersRes.ok) throw new Error('차단된 사용자 목록을 불러오는 데 실패했습니다.');
                setBannedUsers(await bannedUsersRes.json());
                
                await fetchInquiries();

            } catch (e: any) {
                toast.error(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [fetchInquiries]);

    // Polling for inquiries
    useEffect(() => {
        const interval = setInterval(() => {
            fetchInquiries();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchInquiries]);


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
            toast.success('단어가 추가되었습니다.');
        } catch (e: any) { toast.error('단어 추가에 실패했습니다.'); }
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
            toast.success('단어가 삭제되었습니다.');
        } catch (e: any) { toast.error('단어 삭제에 실패했습니다.'); }
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
            toast.success('항목이 성공적으로 저장되었습니다.');
        } catch (e: any) { toast.error(e.message); }
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
                toast.success('태그가 성공적으로 삭제되었습니다.');
            } else {
                setReviewsToModerate(reviews => reviews.filter(r => r.id !== id));
                toast.success('리뷰가 성공적으로 삭제되었습니다.');
            }
            setItemToDelete(null);
        } catch (e: any) { toast.error(e.message); }
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
            toast.success('사용자 차단이 해제되었습니다.');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleOpenReplyDialog = (inquiry: Inquiry) => {
        setReplyingInquiry(inquiry);
        setReplyText(inquiry.adminReply || '');
    };

    const handleReplySubmit = async () => {
        if (!replyingInquiry || !replyText.trim()) return;

        try {
            const res = await fetch(`/api/admin/inquiries/${replyingInquiry.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminReply: replyText }),
            });

            if (!res.ok) {
                throw new Error('답변 등록에 실패했습니다.');
            }

            const updatedInquiry = await res.json();
            setInquiries(inquiries.map(i => i.id === updatedInquiry.id ? updatedInquiry : i));
            setReplyingInquiry(null);
            setReplyText('');
            toast.success('답변이 성공적으로 등록되었습니다.');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleSendMessage = async (title: string, message: string) => {
        if (!messagingUser) return;
        setIsSendingMessage(true);
        try {
            const res = await fetch('/api/admin/inquiries/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: messagingUser.id, title, message }),
            });
            if (!res.ok) {
                throw new Error('메시지 전송에 실패했습니다.');
            }
            toast.success('메시지를 성공적으로 보냈습니다.');
            setMessagingUser(null);
        } catch (e: any) {
            setError(e.message);
            toast.error(`오류: ${e.message}`);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const chartTitles: { [key in ActiveChart]: string } = {
        users: '신규 사용자',
        reviews: '신규 리뷰',
        tags: '신규 태그',
        restaurantVotes: '음식점 투표',
        reviewVotes: '리뷰 투표',
    };

    const getChartData = () => {
        if (!stats) return [];
        if (chartPeriod === 'weekly') {
            return aggregateData(stats.timeSeries, 'weekly');
        }
        if (chartPeriod === 'monthly') {
            return aggregateData(stats.timeSeries, 'monthly');
        }
        return stats.timeSeries;
    };

    const aggregateData = (data: TimeSeriesData[], period: 'weekly' | 'monthly') => {
        if (!data) return [];
        const aggregationMap = new Map<string, any>();
        const key = period === 'weekly' ? 'w' : 'm';

        data.forEach(item => {
            const date = new Date(item.date);
            let periodKey: string;
            if (period === 'weekly') {
                const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
                periodKey = weekStart.toISOString().split('T')[0];
            } else { // monthly
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!aggregationMap.has(periodKey)) {
                aggregationMap.set(periodKey, { date: periodKey, users: 0, reviews: 0, tags: 0, restaurantVotes: 0, reviewVotes: 0 });
            }
            const current = aggregationMap.get(periodKey);
            aggregationMap.set(periodKey, {
                ...current,
                users: current.users + item.users,
                reviews: current.reviews + item.reviews,
                tags: current.tags + item.tags,
                restaurantVotes: current.restaurantVotes + item.restaurantVotes,
                reviewVotes: current.reviewVotes + item.reviewVotes,
            });
        });
        return Array.from(aggregationMap.values());
    };

    const handleCreateSnapshot = async () => {
        try {
            const res = await fetch('/api/admin/stats/snapshot', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || '통계 생성에 실패했습니다.');
            }
            toast.success(data.message || '통계가 성공적으로 생성되었습니다.');
            // Refresh stats after creation
            const statsRes = await fetch('/api/admin/stats');
            setStats(await statsRes.json());
        } catch (e: any) {
            toast.error(`오류: ${e.message}`);
        }
    };

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-screen w-full"/></div>;
    }
    
    const hasNewModeration = tagsToModerate.length > 0 || reviewsToModerate.length > 0;
    const hasNewInquiries = inquiries.some(i => !i.isResolved);

    return (
        <>
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" onClick={() => router.push('/')} className="p-2 h-auto mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">관리자 페이지</h1>
                </div>
                
                <Tabs defaultValue="dashboard">
                    <TabsList className="mb-4">
                        <TabsTrigger value="dashboard">대시보드</TabsTrigger>
                        <TabsTrigger value="management" className="relative">
                            콘텐츠 관리
                            {hasNewModeration && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />}
                        </TabsTrigger>
                        <TabsTrigger value="users">사용자 관리</TabsTrigger>
                        <TabsTrigger value="inquiries" className="relative">
                            문의 관리
                            {hasNewInquiries && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard">
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <StatCard title="총 사용자" value={stats?.totals.users ?? '-'} icon={<Users className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('users')} isActive={activeChart === 'users'} />
                                <StatCard title="총 리뷰" value={stats?.totals.reviews ?? '-'} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('reviews')} isActive={activeChart === 'reviews'} />
                                <StatCard title="총 태그" value={stats?.totals.tags ?? '-'} icon={<Tag className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('tags')} isActive={activeChart === 'tags'} />
                                <StatCard title="음식점 투표" value={stats?.totals.restaurantVotes ?? '-'} icon={<ThumbsUp className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('restaurantVotes')} isActive={activeChart === 'restaurantVotes'} />
                                <StatCard title="리뷰 투표" value={stats?.totals.reviewVotes ?? '-'} icon={<GitCompareArrows className="h-4 w-4 text-muted-foreground" />} onClick={() => setActiveChart('reviewVotes')} isActive={activeChart === 'reviewVotes'} />
                            </div>
                            <div className="flex items-center gap-4">
                                <Tabs value={chartPeriod} onValueChange={(value) => setChartPeriod(value)}>
                                    <TabsList>
                                        <TabsTrigger value="daily">일간</TabsTrigger>
                                        <TabsTrigger value="weekly">주간</TabsTrigger>
                                        <TabsTrigger value="monthly">월간</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Button onClick={handleCreateSnapshot} variant="outline">어제 통계 수동 생성</Button>
                            </div>
                            {stats && <DashboardChart data={getChartData()} dataKey={activeChart} title={`${chartTitles[activeChart]} (${chartPeriod === 'daily' ? '일간' : chartPeriod === 'weekly' ? '주간' : '월간'})`} />}
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
                                                    <Button variant="outline" size="sm" onClick={() => setMessagingUser(user)}>메시지</Button>
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

                    <TabsContent value="inquiries">
                        <Card>
                            <CardHeader>
                                <CardTitle>사용자 문의 관리</CardTitle>
                                <Tabs value={inquiryFilter} onValueChange={(value) => setInquiryFilter(value as any)}>
                                    <TabsList>
                                        <TabsTrigger value="unresolved">미해결</TabsTrigger>
                                        <TabsTrigger value="resolved">해결됨</TabsTrigger>
                                        <TabsTrigger value="admin-sent">관리자 발신</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
                                    {inquiries.filter(i => {
                                        if (inquiryFilter === 'admin-sent') return i.isFromAdmin;
                                        if (inquiryFilter === 'resolved') return !i.isFromAdmin && i.isResolved;
                                        return !i.isFromAdmin && !i.isResolved;
                                    }).length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            {inquiryFilter === 'resolved' ? '해결된 문의가 없습니다.' :
                                             inquiryFilter === 'admin-sent' ? '관리자가 보낸 메시지가 없습니다.' :
                                             '미해결된 문의가 없습니다.'}
                                        </p>
                                    ) : (
                                        inquiries.filter(i => {
                                            if (inquiryFilter === 'admin-sent') return i.isFromAdmin;
                                            if (inquiryFilter === 'resolved') return !i.isFromAdmin && i.isResolved;
                                            return !i.isFromAdmin && !i.isResolved;
                                        }).map(inquiry => (
                                            <div key={inquiry.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-grow">
                                                        <div className="flex items-center">
                                                            <p className="font-semibold">{inquiry.title}</p>
                                                            {!inquiry.isFromAdmin && !inquiry.isResolved && <span className="ml-2 h-2 w-2 rounded-full bg-red-500" />}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {inquiry.isFromAdmin ? 'To: ' : 'From: '}
                                                            <Link href={`/admin/users/${inquiry.user.id}`} className="hover:underline">{inquiry.user.name} ({inquiry.user.email})</Link>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {inquiry.isFromAdmin ? 'Sent: ' : 'Received: '}
                                                            {new Date(inquiry.createdAt).toLocaleString('ko-KR')}
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="default"
                                                        onClick={() => handleOpenReplyDialog(inquiry)}
                                                    >
                                                        {inquiry.isFromAdmin ? '메시지 보기' : (inquiry.isResolved ? '답변 보기/수정' : '답변하기')}
                                                    </Button>
                                                </div>
                                                <p className="mt-4 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{inquiry.message}</p>
                                                {inquiry.adminReply && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold text-primary">관리자 답변:</p>
                                                        <p className="text-sm whitespace-pre-wrap bg-primary/10 p-3 rounded-md">{inquiry.adminReply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </main>

            {replyingInquiry && (
                <Dialog open={!!replyingInquiry} onOpenChange={() => setReplyingInquiry(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{replyingInquiry.isFromAdmin ? "관리자 발신 메시지 상세" : "문의 답변하기"}</DialogTitle>
                            <DialogDescription>
                                <p className="font-semibold mt-2">
                                    {replyingInquiry.isFromAdmin ? "제목: " : "문의 제목: "}
                                    {replyingInquiry.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {replyingInquiry.isFromAdmin ? 'To: ' : 'From: '} 
                                    {replyingInquiry.user.name} ({replyingInquiry.user.email})
                                </p>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="font-semibold">{replyingInquiry.isFromAdmin ? "보낸 메시지 내용" : "사용자 문의 내용"}</Label>
                                <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">
                                    {replyingInquiry.message}
                                </div>
                            </div>
                            {!replyingInquiry.isFromAdmin && (
                                <div>
                                    <Label htmlFor="adminReply" className="font-semibold">답변 작성</Label>
                                    <Textarea
                                        id="adminReply"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={8}
                                        placeholder="여기에 답변을 입력하세요..."
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            {replyingInquiry.isFromAdmin ? (
                                <Button onClick={() => setReplyingInquiry(null)}>확인</Button>
                            ) : (
                                <>
                                    <Button variant="secondary" onClick={() => setReplyingInquiry(null)}>취소</Button>
                                    <Button onClick={handleReplySubmit} disabled={!replyText.trim()}>답변 등록</Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {messagingUser && (
                <AdminMessageDialog
                    isOpen={!!messagingUser}
                    onOpenChange={() => setMessagingUser(null)}
                    onSendMessage={handleSendMessage}
                    userName={messagingUser.name || '이름 없음'}
                    isSending={isSendingMessage}
                />
            )}

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
