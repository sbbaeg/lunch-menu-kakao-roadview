
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface AdminEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: 'tag' | 'review';
    initialText: string;
    onSave: (newText: string) => Promise<void>;
}

export function AdminEditDialog({ 
    isOpen, 
    onClose, 
    itemType, 
    initialText, 
    onSave 
}: AdminEditDialogProps) {
    const [text, setText] = useState(initialText);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setText(initialText);
    }, [initialText]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(text);
            onClose();
        } catch (error) {
            console.error("Failed to save item:", error);
            // 여기에 사용자에게 오류를 표시하는 로직을 추가할 수 있습니다.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{itemType === 'tag' ? '태그' : '리뷰'} 수정</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {itemType === 'tag' ? (
                        <Input 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    ) : (
                        <Textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        취소
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? '저장 중...' : '저장'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
