import { useState, useEffect, useRef } from "react"; 
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/lib/types";
import { useSession } from "next-auth/react";
import { Users, Utensils } from "lucide-react";

interface SubscribedTag {
    id: number;
    name: string;
    creatorName: string | null;
}

interface SearchedTag {
    id: number;
    name: string;
    creatorName: string | null;
    restaurantCount: number;
    subscriberCount: number;
}

interface TagManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userTags: Tag[];
  onDeleteTag: (tagId: number) => void;
  onToggleTagPublic: (tagId: number) => void;
  onCreateTag: (tagName: string) => Promise<Tag | null>;
}

export function TagManagementDialog({
  isOpen,
  onOpenChange,
  userTags,
  onDeleteTag,
  onToggleTagPublic,
  onCreateTag,
}: TagManagementDialogProps) {
  const { status } = useSession();
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [subscribedTags, setSubscribedTags] = useState<SubscribedTag[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedTag[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ 2개의 스크롤 영역을 위한 ref 생성
  const myTagsScrollRef = useRef<HTMLDivElement>(null);
  const subscribedTagsScrollRef = useRef<HTMLDivElement>(null);

  // ✅ 마우스 휠 문제 해결을 위한 useEffect 추가
  useEffect(() => {
    const refs = [myTagsScrollRef.current, subscribedTagsScrollRef.current];
    const handleWheel = (event: WheelEvent) => {
        event.stopPropagation();
    };

    refs.forEach(ref => {
        if (ref) ref.addEventListener('wheel', handleWheel);
    });

    return () => {
        refs.forEach(ref => {
            if (ref) ref.removeEventListener('wheel', handleWheel);
        });
    };
  }, [isOpen]); // 다이얼로그가 열릴 때마다 리스너 설정

  useEffect(() => {
    const fetchSubscribedTags = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/subscriptions');
          if (response.ok) {
            const data = await response.json();
            setSubscribedTags(data);
          }
        } catch (error) {
          console.error("구독 태그 로딩 실패:", error);
        }
      }
    };
    if (isOpen) {
      fetchSubscribedTags();
    }
  }, [isOpen, status]);

  useEffect(() => {
    // 0.5초 동안 추가 입력이 없으면 검색 실행 (디바운싱)
    const debounceTimer = setTimeout(() => {
        if (searchQuery.trim() !== "") {
            setIsSearching(true);
            fetch(`/api/tags/explore?query=${searchQuery.trim()}`)
                .then(res => res.json())
                .then(data => setSearchResults(data))
                .catch(err => console.error("Tag search failed:", err))
                .finally(() => setIsSearching(false));
        } else {
            setSearchResults([]);
        }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCreateTag = async () => {
    if (!newTagName.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    await onCreateTag(newTagName);
    setNewTagName("");
    setIsCreatingTag(false);
  };
  
  const filteredTags = newTagName.trim() === ''
    ? userTags
    : userTags.filter(tag => tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()));

  // ✅ 구독 취소 함수를 컴포넌트 내부로 이동
  const handleUnsubscribe = async (tagId: number) => {
    const originalSubscriptions = subscribedTags;
    setSubscribedTags(prev => prev.filter(tag => tag.id !== tagId));
    try {
        const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
        if (!response.ok) {
            setSubscribedTags(originalSubscriptions);
            alert("구독 취소에 실패했습니다.");
        }
    } catch (error) {
        setSubscribedTags(originalSubscriptions);
        alert("구독 취소 중 오류가 발생했습니다.");
    }
  };

  const fetchSubscribedTags = async () => {
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscribedTags(data);
        }
      } catch (error) {
        console.error("구독 태그 로딩 실패:", error);
      }
    }
  };

  const handleSubscribe = async (tagId: number) => {
    try {
        const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
        if (response.ok) {
            // 구독 성공 시, 구독 목록을 다시 불러와서 UI를 갱신합니다.
            fetchSubscribedTags(); 
        } else {
            alert("구독에 실패했습니다.");
        }
    } catch (error) {
        alert("구독 중 오류가 발생했습니다.");
    }
  };

  const finalSearchResults = searchResults.filter(
      (searchedTag) =>
          !userTags.some((myTag) => myTag.id === searchedTag.id) &&
          !subscribedTags.some((subTag) => subTag.id === searchedTag.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* ✅ 다이얼로그 너비를 넓히고, 내부를 flex 레이아웃으로 변경합니다. */}
      <DialogContent className="max-w-4xl flex flex-col h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">태그 관리</DialogTitle>
        </DialogHeader>
        {/* ✅ 전체 콘텐츠 영역을 가로로 나누는 flex 컨테이너를 추가합니다. */}
        <div className="py-2 flex flex-col md:flex-row gap-6 flex-1 min-h-0">

            {/* 👈 왼쪽: 내 태그 및 구독 태그 관리 */}
            <div className="w-full md:w-1/2 flex flex-col">
                <h4 className="font-semibold mb-2 px-1">내가 만든 태그</h4>
                <div className="flex w-full items-center space-x-2 mb-4 p-1">
                    <Input
                        type="text"
                        placeholder="새 태그 생성 또는 검색"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                        disabled={isCreatingTag}
                    />
                    <Button onClick={handleCreateTag} disabled={isCreatingTag}>
                        {isCreatingTag ? '추가 중...' : '추가'}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 min-h-0" ref={myTagsScrollRef}>
                    {userTags.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredTags.map(tag => (
                                <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <Link href={`/tags/${tag.id}`} className="hover:underline">
                                        {tag.name}
                                    </Link>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch id={`public-switch-${tag.id}`} checked={tag.isPublic} onCheckedChange={() => onToggleTagPublic(tag.id)} />
                                            <Label htmlFor={`public-switch-${tag.id}`} className="text-xs text-muted-foreground">{tag.isPublic ? '공개' : '비공개'}</Label>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => onDeleteTag(tag.id)}>삭제</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground pt-8">
                            {newTagName.trim() === '' ? '생성된 태그가 없습니다.' : '일치하는 태그가 없습니다.'}
                        </p>
                    )}
                </div>

                <Separator className="my-4" />

                <h4 className="font-semibold mb-2 px-1">구독 중인 태그</h4>
                <div className="flex-1 overflow-y-auto pr-4 min-h-0" ref={subscribedTagsScrollRef}>
                    {subscribedTags.length > 0 ? (
                        <ul className="space-y-2">
                            {subscribedTags.map(tag => (
                                <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <Link href={`/tags/${tag.id}`} className="hover:underline">
                                        <div>
                                            <span className="font-semibold">{tag.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">(by {tag.creatorName})</span>
                                        </div>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(tag.id)}>구독 취소</Button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-muted-foreground pt-8">구독 중인 태그가 없습니다.</p>}
                </div>
            </div>

            {/* 세로 구분선 */}
            <Separator orientation="vertical" className="hidden md:block" />
            <Separator className="md:hidden" />

            {/* 👉 오른쪽: 태그 탐색 */}
            <div className="w-full md:w-1/2 flex flex-col">
                <h4 className="font-semibold mb-2 px-1">태그 탐색</h4>
                <div className="p-1 mb-4">
                    <Input
                        type="text"
                        placeholder="다른 사람의 공개 태그 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto pr-4 min-h-0">
                    {isSearching && <p className="text-center text-muted-foreground pt-8">검색 중...</p>}
                    {!isSearching && searchQuery && finalSearchResults.length === 0 && <p className="text-center text-muted-foreground pt-8">검색 결과가 없습니다.</p>}
                    <ul className="space-y-2">
                        {finalSearchResults.map(tag => (
                            <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <div>
                                    <p className="font-semibold">{tag.name}</p>
                                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                                        <span>by {tag.creatorName}</span>
                                        <div className="flex items-center gap-1"><Utensils className="h-3 w-3" /> {tag.restaurantCount}</div>
                                        <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {tag.subscriberCount}</div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleSubscribe(tag.id)}>구독</Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}