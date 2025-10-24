'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAppStore } from '@/store/useAppStore';
import { Users, Utensils, Star, Search, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

interface RankedTag {
  id: number;
  name: string;
  creatorName: string | null;
  restaurantCount: number;
  subscriberCount: number;
}

// 개별 태그 아이템을 렌더링하는 컴포넌트
function TagRankingItem({ tag, isSubscribed, onToggleSubscribe, onTagClick, isAuth }: {
  tag: RankedTag;
  isSubscribed: boolean;
  onToggleSubscribe: (tagId: number) => void;
  onTagClick: (tagId: number) => void;
  isAuth: boolean;
}) {
  return (
    <li className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
      <div className="flex-grow cursor-pointer" onClick={() => onTagClick(tag.id)}>
        <div className="flex flex-col">
          <p className="text-lg font-semibold hover:underline">{tag.name}</p>
          <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
            <span>by {tag.creatorName || '알 수 없음'}</span>
            <div className="flex items-center gap-1"><Utensils className="h-3 w-3" /> {tag.restaurantCount}</div>
            <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {tag.subscriberCount}</div>
          </div>
        </div>
      </div>
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
  const hideTagExplore = useAppStore((state) => state.hideTagExplore);
  const showTagDetail = useAppStore((state) => state.showTagDetail);

  const [rankedTags, setRankedTags] = useState<RankedTag[]>([]);
  const [sort, setSort] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const { subscribedTagIds, toggleSubscription } = useSubscriptions();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RankedTag[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchRankedTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags/explore?sort=${sort}`);
        if (response.ok) {
          const data = await response.json();
          setRankedTags(data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${sort} tags:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankedTags();
  }, [sort]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const debounceTimer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/tags/explore?query=${searchQuery.trim()}`)
        .then(res => res.json())
        .then(data => setSearchResults(data))
        .catch(err => console.error("Tag search failed:", err))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleToggleSubscription = async (tagId: number) => {
    if (status !== 'authenticated') {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    await toggleSubscription(tagId);
  };

  const showSearchResults = searchQuery.trim() !== '';

  return (
    <div className="p-4 h-full flex flex-col bg-card">
        <header className="flex-shrink-0">
            <Button variant="ghost" onClick={hideTagExplore} className="w-fit p-0 h-auto text-muted-foreground mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로가기
            </Button>
            <h1 className="text-2xl font-bold">태그 탐색</h1>
            <p className="text-muted-foreground text-sm">다른 사용자들이 만든 유용한 태그를 찾아보세요.</p>
        </header>

        <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
            type="text"
            placeholder="태그 이름으로 검색..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
            {showSearchResults ? (
                <div>
                    <h3 className="text-lg font-semibold mb-2">검색 결과</h3>
                    {isSearching ? (
                    <ul className="space-y-2 mt-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </ul>
                    ) : searchResults.length > 0 ? (
                    <ul className="space-y-2 mt-4">
                        {searchResults.map(tag => (
                        <TagRankingItem 
                            key={tag.id} 
                            tag={tag} 
                            isSubscribed={subscribedTagIds.includes(tag.id)}
                            onToggleSubscribe={handleToggleSubscription}
                            onTagClick={showTagDetail}
                            isAuth={status === 'authenticated'}
                        />
                        ))}
                    </ul>
                    ) : (
                    <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다.</p>
                    )}
                </div>
            ) : (
                <Tabs value={sort} onValueChange={setSort} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="popular">맛집 많은 순</TabsTrigger>
                    <TabsTrigger value="subscribers">구독자순</TabsTrigger>
                    </TabsList>
                    <TabsContent value="popular" className="mt-4">
                    {isLoading ? (
                        <ul className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </ul>
                    ) : (
                        <ul className="space-y-2">
                        {rankedTags.map(tag => (
                            <TagRankingItem 
                                key={tag.id} 
                                tag={tag} 
                                isSubscribed={subscribedTagIds.includes(tag.id)}
                                onToggleSubscribe={handleToggleSubscription}
                                onTagClick={showTagDetail}
                                isAuth={status === 'authenticated'}
                            />
                        ))}
                        </ul>
                    )}
                    </TabsContent>
                    <TabsContent value="subscribers" className="mt-4">
                    {isLoading ? (
                        <ul className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </ul>
                    ) : (
                        <ul className="space-y-2">
                        {rankedTags.map(tag => (
                            <TagRankingItem 
                                key={tag.id} 
                                tag={tag} 
                                isSubscribed={subscribedTagIds.includes(tag.id)}
                                onToggleSubscribe={handleToggleSubscription}
                                onTagClick={showTagDetail}
                                isAuth={status === 'authenticated'}
                            />
                        ))}
                        </ul>
                    )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    </div>
  );
}
