
"use client";

import { useState, useEffect } from 'react';
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
import { Skeleton } from "@/components/ui/skeleton";

interface Inquiry {
    id: number;
    title: string;
    message: string;
    adminReply: string | null;
    isFromAdmin: boolean;
}

interface NotificationDetailDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    notificationId: number | null;
    inquiryId: number | null;
    onDelete: (notificationId: number) => void;
}

export function NotificationDetailDialog({ isOpen, onOpenChange, notificationId, inquiryId, onDelete }: NotificationDetailDialogProps) {
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && inquiryId) {
            const fetchInquiryDetails = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // Fetch inquiry details
                    const res = await fetch(`/api/inquiries/${inquiryId}`);
                    if (!res.ok) {
                        throw new Error('메시지 내용을 불러오는 데 실패했습니다.');
                    }
                    const data = await res.json();
                    setInquiry(data);

                    // Mark as read
                    await fetch(`/api/inquiries/${inquiryId}/read`, { method: 'PATCH' });

                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInquiryDetails();
        }
    }, [isOpen, inquiryId]);

    const handleDelete = () => {
        if (notificationId) {
            onDelete(notificationId);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4 py-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            );
        }
        if (error) {
            return <p className="text-red-500 py-4">{error}</p>;
        }
        if (inquiry) {
            return (
                <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
                    {inquiry.isFromAdmin ? (
                        <div>
                            <Label className="font-semibold">관리자 메시지</Label>
                            <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">
                                {inquiry.message}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Label className="font-semibold">문의 내용</Label>
                                <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">
                                    {inquiry.message}
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold">관리자 답변</Label>
                                <div className="mt-1 p-3 rounded-md border bg-primary/10 text-sm whitespace-pre-wrap min-h-[100px]">
                                    {inquiry.adminReply || <span className="text-muted-foreground">아직 답변이 없습니다.</span>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{inquiry?.title || '메시지 상세'}</DialogTitle>
                </DialogHeader>
                {renderContent()}
                <DialogFooter>
                    <Button variant="destructive" onClick={handleDelete} disabled={!notificationId}>알림 삭제</Button>
                    <Button onClick={() => onOpenChange(false)}>확인</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
