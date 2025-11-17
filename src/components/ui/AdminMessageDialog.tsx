
"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AdminMessageDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSendMessage: (title: string, message: string) => void;
    userName: string;
    isSending: boolean;
}

export function AdminMessageDialog({ isOpen, onOpenChange, onSendMessage, userName, isSending }: AdminMessageDialogProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (title.trim() && message.trim()) {
            onSendMessage(title, message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{userName}님에게 메시지 보내기</DialogTitle>
                    <DialogDescription>
                        사용자에게 직접 메시지를 보냅니다. 이 메시지는 사용자의 문의 목록에 표시됩니다.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="message-title" className="font-semibold">
                            제목
                        </Label>
                        <Input
                            id="message-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="메시지 제목을 입력하세요."
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="message-content" className="font-semibold">
                            내용
                        </Label>
                        <Textarea
                            id="message-content"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            placeholder="보낼 메시지 내용을 입력하세요..."
                            className="mt-1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>취소</Button>
                    <Button onClick={handleSend} disabled={!title.trim() || !message.trim() || isSending}>
                        {isSending ? '보내는 중...' : '보내기'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
