
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldOff, ArrowLeft } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from "@/components/ui/textarea";

// --- TYPE DEFINITIONS ---
interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  reviews: { id: number; text: string | null; rating: number; restaurant: { placeName: string } }[];
  tags: { id: number; name: string }[];
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
      router.push('/');
      return;
    }

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error('사용자 정보를 불러오는 데 실패했습니다.');
        setUser(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [session, status, router, userId]);

  const handleToggleStatus = async (type: 'isAdmin' | 'isBanned', currentValue: boolean, reason?: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, status: !currentValue, reason }),
      });
      if (!res.ok) throw new Error('상태 변경에 실패했습니다.');
      const updatedUser = await res.json();
      setUser(updatedUser);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleBanSwitchChange = (isBanned: boolean) => {
    if (isBanned) {
      // Unbanning the user
      handleToggleStatus('isBanned', true);
    } else {
      // Banning the user, open dialog
      setShowBanDialog(true);
    }
  };

  const handleConfirmBan = () => {
    handleToggleStatus('isBanned', false, banReason);
    setShowBanDialog(false);
    setBanReason("");
  };

  if (status === 'loading' || isLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full"/></div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="p-8">사용자를 찾을 수 없습니다.</div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로가기
      </Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAdmin"
                  checked={user.isAdmin}
                  onCheckedChange={() => handleToggleStatus('isAdmin', user.isAdmin)}
                  disabled={user.id === session?.user?.id}
                />
                <label htmlFor="isAdmin" className="flex items-center gap-1 font-medium"><Shield className="h-4 w-4" /> 관리자</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isBanned"
                  checked={user.isBanned}
                  onCheckedChange={() => handleBanSwitchChange(user.isBanned)}
                  disabled={user.id === session?.user?.id}
                />
                <label htmlFor="isBanned" className="flex items-center gap-1 font-medium text-red-500"><ShieldOff className="h-4 w-4" /> 차단</label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reviews">
            <TabsList>
              <TabsTrigger value="reviews">작성한 리뷰 ({user.reviews.length})</TabsTrigger>
              <TabsTrigger value="tags">생성한 태그 ({user.tags.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews" className="mt-4 max-h-[600px] overflow-y-auto space-y-4 pr-2">
              {user.reviews.length > 0 ? user.reviews.map(review => (
                <div key={review.id} className="p-3 border rounded-md">
                  <p className="font-semibold">{review.restaurant.placeName}</p>
                  <p className="text-sm text-muted-foreground">평점: {review.rating}</p>
                  <blockquote className="mt-1 p-2 border-l-4 bg-muted/50 text-sm">
                    {review.text || "(리뷰 내용 없음)"}
                  </blockquote>
                </div>
              )) : <p className="text-muted-foreground">작성한 리뷰가 없습니다.</p>}
            </TabsContent>
            <TabsContent value="tags" className="mt-4 max-h-[600px] overflow-y-auto space-y-2 pr-2">
              {user.tags.length > 0 ? user.tags.map(tag => (
                <div key={tag.id} className="p-2 border rounded-md">
                  <p className="font-medium">{tag.name}</p>
                </div>
              )) : <p className="text-muted-foreground">생성한 태그가 없습니다.</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 차단</AlertDialogTitle>
            <AlertDialogDescription>
              사용자를 차단하는 사유를 입력해주세요. 이 사유는 사용자에게 알림으로 전달됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="예: 스팸 리뷰 작성"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBan}>차단 확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}
