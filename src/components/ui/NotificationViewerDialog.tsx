
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
import { Notification as PrismaNotification } from '@prisma/client';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Inquiry {
    id: number;
    title: string;
    message: string;
    adminReply: string | null;
    isFromAdmin: boolean;
    user: {
        name: string | null;
    };
}

interface NotificationViewerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    notification: PrismaNotification | null;
    onDelete: (notificationId: number) => void;
    link?: string | null;
}

export function NotificationViewerDialog({ isOpen, onOpenChange, notification, onDelete, link }: NotificationViewerDialogProps) {
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useMediaQuery("(max-width: 768px)");

    useEffect(() => {
        if (isOpen && notification?.inquiryId) {
            const fetchInquiryDetails = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch(`/api/inquiries/${notification.inquiryId}`);
                    if (!res.ok) {
                        throw new Error('메시지 내용을 불러오는 데 실패했습니다.');
                    }
                    const data = await res.json();
                    setInquiry(data);

                    await fetch(`/api/inquiries/${notification.inquiryId}/read`, { method: 'PATCH' });

                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInquiryDetails();
        } else if (isOpen && notification) {
            setInquiry(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen, notification]);

    const handleDelete = () => {
        if (notification) {
            onDelete(notification.id);
        }
    };

    const getCategoryLabel = () => {
        if (!notification) return '';
        if (inquiry?.isFromAdmin) return '관리자 메시지';
        if (notification.inquiryId) return '문의 답변';
        switch (notification.type) {
            case 'TAG_SUBSCRIPTION': return '태그 알림';
            case 'REVIEW_UPVOTE':
            case 'BEST_REVIEW': return '리뷰 알림';
            default: return '일반 알림';
        }
    };

    const getSenderLabel = () => {
        if (!notification) return '';
        if (inquiry?.isFromAdmin) return '관리자';
        if (inquiry) return inquiry.user.name || '사용자';
        return '시스템';
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4 py-4 px-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            );
        }
        if (error) {
            return <p className="text-red-500 py-4 px-4">{error}</p>;
        }
        // Case 1: It's an inquiry notification
        if (inquiry) {
            return (
                <div className="space-y-4 py-4 px-4">
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
        // Case 2: It's a simple notification
        if (notification) {
             return (
                <div className="py-4 px-4">
                    <p>{notification.message}</p>
                </div>
             )
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "flex flex-col",
                isMobile 
                    ? "h-screen w-screen max-w-full rounded-none border-0" 
                    : "max-w-2xl min-h-[300px]"
            )}>
                <DialogHeader className={cn("p-4 border-b", isMobile && "flex-shrink-0")}>
                    <div className="flex items-center gap-4">
                        {isMobile && (
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        )}
                        <DialogTitle className="truncate">{inquiry?.title || notification?.message || '알림 상세'}</DialogTitle>
                    </div>
                    {notification && (
                        <DialogDescription className="text-xs text-muted-foreground pt-2 space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold w-16">유형:</span>
                                <span>{getCategoryLabel()}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold w-16">발신:</span>
                                <span>{getSenderLabel()}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold w-16">수신 일시:</span>
                                <span>{format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
                            </div>
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="flex-grow overflow-y-auto">
                    {renderContent()}
                </div>
                <DialogFooter className={cn("p-4 border-t", isMobile && "flex-shrink-0")}>
                    <Button variant="destructive" onClick={handleDelete} disabled={!notification}>알림 삭제</Button>
                    {link && <Button variant="outline" asChild><a href={link} onClick={() => onOpenChange(false)}>보러 가기</a></Button>}
                    <Button onClick={() => onOpenChange(false)}>확인</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
