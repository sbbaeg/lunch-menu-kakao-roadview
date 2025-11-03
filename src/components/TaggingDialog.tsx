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
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "@/components/ui/toast";

interface TaggingDialogProps {
  restaurant: AppRestaurant | null;
  onOpenChange: (isOpen: boolean) => void;
  userTags: Tag[];
  onToggleTagLink: (tag: Tag) => void;
  onCreateAndLinkTag: (tagName: string) => Promise<void>;
  isBanned: boolean;
}

export function TaggingDialog({
  restaurant,
  onOpenChange,
  userTags,
  onToggleTagLink,
  onCreateAndLinkTag,
  isBanned,
}: TaggingDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCreate = async () => {
    if (!newTagName.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    await onCreateAndLinkTag(newTagName);
    setIsCreatingTag(false);
    setNewTagName("");
  };

  const filteredTags = newTagName.trim() === ''
    ? userTags
    : userTags.filter(tag => tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()));

  const isOpen = !!restaurant;

  const AddTagButton = () => {
    if (isBanned) {
      if (isDesktop) {
        return <Button disabled>차단된 사용자</Button>;
      }
      return (
        <Button
          type="button"
          aria-disabled="true"
          className="opacity-50 cursor-not-allowed"
          onClick={() => toast.error("생성 제한", { description: "차단된 사용자는 태그를 생성할 수 없습니다." })}
        >
          추가
        </Button>
      );
    }

    return (
      <Button onClick={handleCreate} disabled={isCreatingTag}>
        {isCreatingTag ? '추가 중...' : '추가'}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
              disabled={isCreatingTag || isBanned}
            />
            <AddTagButton />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            <p className="text-sm font-medium text-muted-foreground">내 태그 목록</p>
            {filteredTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={restaurant?.tags?.some(rt => rt.id === tag.id)}
                  onCheckedChange={() => onToggleTagLink(tag)}
                  disabled={isBanned}
                />
                <Label htmlFor={`tag-${tag.id}`} className={`cursor-pointer ${isBanned ? 'opacity-50 cursor-not-allowed' : ''}`}>
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