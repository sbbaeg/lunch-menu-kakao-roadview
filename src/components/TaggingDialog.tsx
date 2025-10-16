import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AppRestaurant, Tag } from "@/lib/types";

interface TaggingDialogProps {
  restaurant: AppRestaurant | null;
  onOpenChange: (isOpen: boolean) => void;
  userTags: Tag[];
  onToggleTagLink: (tag: Tag) => void;
  onCreateAndLinkTag: (tagName: string) => Promise<void>;
}

export function TaggingDialog({
  restaurant,
  onOpenChange,
  userTags,
  onToggleTagLink,
  onCreateAndLinkTag,
}: TaggingDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleCreate = async () => {
    if (!newTagName.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    await onCreateAndLinkTag(newTagName);
    setIsCreatingTag(false);
    setNewTagName("");
    // 성공 시 다이얼로그를 닫을 수도 있습니다. 이건 선택사항입니다.
    // onOpenChange(false);
  };

  const filteredTags = newTagName.trim() === ''
    ? userTags
    : userTags.filter(tag => tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()));

  // isOpen 상태는 restaurant prop의 존재 여부로 결정합니다.
  const isOpen = !!restaurant;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>태그 관리: {restaurant?.placeName}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <div className="flex w-full items-center space-x-2 mb-4">
            <Input
              type="text"
              placeholder="새 태그 생성 또는 검색 (예: #가성비)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              disabled={isCreatingTag}
            />
            <Button onClick={handleCreate} disabled={isCreatingTag}>
              {isCreatingTag ? '추가 중...' : '추가'}
            </Button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            <p className="text-sm font-medium text-muted-foreground">내 태그 목록</p>
            {filteredTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={restaurant?.tags?.some(rt => rt.id === tag.id)}
                  onCheckedChange={() => onToggleTagLink(tag)}
                />
                <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                  {tag.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}