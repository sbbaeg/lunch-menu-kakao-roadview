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
import { Tag } from "@/lib/types";
import { useSession } from "next-auth/react";

import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import { useAppStore } from "@/store/useAppStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

interface SubscribedTag {
    id: number;
    name: string;
    creatorName: string | null;
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
  const showTagDetail = useAppStore((state) => state.showTagDetail);

  const myTagsScrollRef = useRef<HTMLDivElement>(null);
  const subscribedTagsScrollRef = useRef<HTMLDivElement>(null);

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
  }, [isOpen]);

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
          toast.error("구독 태그 로딩 실패");
        }
      }
    };
    if (isOpen) {
      fetchSubscribedTags();
    }
  }, [isOpen, status]);

  const handleCreateTag = async () => {
    if (!newTagName.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    const newTag = await onCreateTag(newTagName);
    if (newTag) {
      toast(`'${newTag.name}' 태그가 생성되었습니다.`);
    } else {
      toast.error("태그 생성에 실패했습니다.");
    }
    setNewTagName("");
    setIsCreatingTag(false);
  };
  
  const filteredTags = newTagName.trim() === ''
    ? userTags
    : userTags.filter(tag => tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()));

  const handleUnsubscribe = async (tagId: number) => {
    const originalSubscriptions = subscribedTags;
    setSubscribedTags(prev => prev.filter(tag => tag.id !== tagId));
    try {
        const response = await fetch(`/api/tags/${tagId}/subscribe`, { method: 'POST' });
        if (!response.ok) {
            setSubscribedTags(originalSubscriptions);
            toast.error("구독 취소에 실패했습니다.");
        } else {
            toast("구독이 취소되었습니다.");
        }
    } catch (error) {
        setSubscribedTags(originalSubscriptions);
        toast.error("구독 취소 중 오류가 발생했습니다.");
    }
  };

  const { isStandalone } = usePwaDisplayMode();

  const handleTagClick = (e: React.MouseEvent, tagId: number) => {
    if (isStandalone) {
      e.preventDefault();
      showTagDetail(tagId);
      onOpenChange(false); // Close the dialog
    }
    // On PC, do nothing, let the Link component handle it.
  };

  const MyTagsView = (
    <div className="w-full flex flex-col gap-4 h-full">
        <div className="flex flex-col">
            <h4 className="font-semibold mb-2 px-1">내가 만든 태그</h4>
            <div className="flex w-full items-center space-x-2 p-1">
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
        </div>
        <div className="flex-1 overflow-y-auto pr-4 min-h-0">
            {userTags.length > 0 ? (
                <ul className="space-y-2">
                    {filteredTags.map(tag => (
                        <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <Link href={`/tags/${tag.id}`} onClick={(e) => handleTagClick(e, tag.id)} className="hover:underline">
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
    </div>
  );

  const SubscribedTagsView = (
    <div className="w-full flex flex-col gap-4 h-full">
        <h4 className="font-semibold px-1">구독 중인 태그</h4>
        <div className="flex-1 overflow-y-auto pr-4 min-h-0">
            {subscribedTags.length > 0 ? (
                <ul className="space-y-2">
                    {subscribedTags.map(tag => (
                        <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <Link href={`/tags/${tag.id}`} onClick={(e) => handleTagClick(e, tag.id)} className="hover:underline">
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-4xl flex flex-col h-[85vh]">
            <DialogHeader>
                <DialogTitle className="text-xl">태그 관리</DialogTitle>
            </DialogHeader>
            
            {isStandalone ? (
                // PWA (모바일) 탭 레이아웃
                <Tabs defaultValue="my-tags" className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="my-tags">내 태그</TabsTrigger>
                        <TabsTrigger value="subscribed-tags">구독 태그</TabsTrigger>
                    </TabsList>
                    <TabsContent value="my-tags" className="flex-1 overflow-y-auto mt-4">
                        {MyTagsView}
                    </TabsContent>
                    <TabsContent value="subscribed-tags" className="flex-1 overflow-y-auto mt-4">
                        {SubscribedTagsView}
                    </TabsContent>
                </Tabs>
            ) : (
                // PC (데스크탑) 좌우 분할 레이아웃
                <div className="py-2 flex flex-row gap-6 flex-1 min-h-0">
                    <div className="w-1/2 flex flex-col gap-4">
                        {MyTagsView}
                    </div>
                    <Separator orientation="vertical" />
                    <div className="w-1/2 flex flex-col gap-4">
                        {SubscribedTagsView}
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
  );
}