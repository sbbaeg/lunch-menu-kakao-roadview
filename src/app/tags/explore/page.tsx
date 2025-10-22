'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import Link from 'next/link';
import { Users, Utensils, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RankedTag {
  id: number;
  name: string;
  creatorName: string | null;
  restaurantCount: number;
  subscriberCount: number;
}

// 개별 태그 아이템을 렌더링하는 컴포넌트
function TagRankingItem({ tag, isSubscribed, onToggleSubscribe, isAuth }: {
  tag: RankedTag;
  isSubscribed: boolean;
  onToggleSubscribe: (tagId: number) => void;
  isAuth: boolean;
}) {
  return (
    <li className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
      <Link href={`/tags/${tag.id}`} className="flex-grow">
        <div className="flex flex-col">
          <p className="text-lg font-semibold hover:underline">{tag.name}</p>
          <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
            <span>by {tag.creatorName || '알 수 없음'}</span>
            <div className="flex items-center gap-1"><Utensils className="h-3 w-3" /> {tag.restaurantCount}</div>
            <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {tag.subscriberCount}</div>
          </div>
        </div>
      </Link>
      {isAuth && (
        <Button variant={isSubscribed ? 'default' : 'outline'} size="sm" onClick={() => onToggleSubscribe(tag.id)}>
          <Star className={`mr-2 h-4 w-4 ${isSubscribed ? 'fill-current' : ''}`} />
          {isSubscribed ? '구독 중' : '구독'}
        </Button>
      )}
    </li>
  );
}

export default function TagExplorePage() {
  const { status } = useSession();
  const [tags, setTags] = useState<RankedTag[]>([]);
  const [sort, setSort] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const { subscribedTagIds, toggleSubscription } = useSubscriptions();

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags/explore?sort=${sort}`);
        if (response.ok) {
          const data = await response.json();
          setTags(data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${sort} tags:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [sort]);

  const handleToggleSubscription = async (tagId: number) => {
    if (status !== 'authenticated') {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    // useSubscriptions 훅의 toggleSubscription 함수를 직접 사용
    await toggleSubscription(tagId);
  };

  return (
    <main className="w-full min-h-screen p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">태그 탐색</CardTitle>
            <p className="text-muted-foreground">다른 사용자들이 만든 유용한 태그들을 발견하고 구독해보세요.</p>
          </CardHeader>
          <CardContent>
            <Tabs value={sort} onValueChange={setSort} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="popular">맛집 많은 순</TabsTrigger>
                <TabsTrigger value="subscribers">구독자순</TabsTrigger>
              </TabsList>
              <TabsContent value="popular">
                {isLoading ? (
                  <ul className="space-y-2 mt-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </ul>
                ) : (
                  <ul className="space-y-2 mt-4">
                    {tags.map(tag => (
                      <TagRankingItem 
                        key={tag.id} 
                        tag={tag} 
                        isSubscribed={subscribedTagIds.includes(tag.id)}
                        onToggleSubscribe={handleToggleSubscription}
                        isAuth={status === 'authenticated'}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="subscribers">
                {isLoading ? (
                  <ul className="space-y-2 mt-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </ul>
                ) : (
                  <ul className="space-y-2 mt-4">
                    {tags.map(tag => (
                      <TagRankingItem 
                        key={tag.id} 
                        tag={tag} 
                        isSubscribed={subscribedTagIds.includes(tag.id)}
                        onToggleSubscribe={handleToggleSubscription}
                        isAuth={status === 'authenticated'}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
