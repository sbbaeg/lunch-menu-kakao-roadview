
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from 'lucide-react';
import { useInquiryNotifications } from "@/hooks/useInquiryNotifications";

interface Inquiry {
  id: number;
  title: string;
  message: string;
  adminReply: string | null;
  isResolved: boolean;
  isReadByUser: boolean; // Added for notification
  createdAt: string;
}

interface ContactAdminDialogProps {
  children: React.ReactNode;
}

export function ContactAdminDialog({ children }: ContactAdminDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { markInquiriesAsRead } = useInquiryNotifications(); // Use the hook

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInquiries();
      markInquiriesAsRead(); // Mark inquiries as read when dialog opens
      // Reset view to list when re-opened
      setView('list');
    }
  }, [isOpen, markInquiriesAsRead]); // Add markInquiriesAsRead to dependency array

  const fetchInquiries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/inquiries');
      if (!response.ok) {
        throw new Error('문의 목록을 불러오는 데 실패했습니다.');
      }
      const data: Inquiry[] = await response.json();
      setInquiries(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setView('detail');
  };

  const handleSubmit = async () => {
    if (title.trim().length === 0 || message.trim().length === 0) {
      alert('제목과 문의 내용을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });

      if (!response.ok) {
        throw new Error('문의 접수 중 오류가 발생했습니다.');
      }

      alert('문의가 성공적으로 접수되었습니다.');
      setTitle('');
      setMessage('');
      setView('list');
      fetchInquiries(); // Refresh the list
    } catch (error: any) {
      alert(error.message);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (view === 'list') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>문의 내역</DialogTitle>
            <DialogDescription>과거에 문의했던 내역을 확인하거나 새 문의를 작성할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] min-h-[300px] overflow-y-auto space-y-3 pr-2 py-4">
            {isLoading && <p>목록을 불러오는 중...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && inquiries.length === 0 && <p className="text-center text-muted-foreground pt-8">문의 내역이 없습니다.</p>}
            {inquiries.map(inq => (
              <div key={inq.id} onClick={() => handleViewDetails(inq)} className="p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate pr-4">{inq.title}</p>
                    {inq.isResolved && !inq.isReadByUser && (
                      <span className="block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  {inq.isResolved && <Badge>답변완료</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{new Date(inq.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setView('create')}>새 문의 작성</Button>
          </DialogFooter>
        </>
      );
    }

    if (view === 'detail' && selectedInquiry) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
              <DialogTitle className="truncate">{selectedInquiry.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
            <div>
              <Label className="font-semibold">문의 내용</Label>
              <div className="mt-1 p-3 rounded-md border bg-muted/50 text-sm whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>
            <div>
              <Label className="font-semibold">관리자 답변</Label>
              <div className="mt-1 p-3 rounded-md border bg-primary/10 text-sm whitespace-pre-wrap min-h-[100px]">
                {selectedInquiry.adminReply || <span className="text-muted-foreground">아직 답변이 없습니다.</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setView('list')}>목록으로</Button>
          </DialogFooter>
        </>
      );
    }

    if (view === 'create') {
      return (
        <>
          <DialogHeader>
             <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
              <DialogTitle>새 문의 작성</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="문의 제목을 입력하세요." />
            </div>
            <div>
              <Label htmlFor="message">문의 내용</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="여기에 문의 내용을 입력하세요." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setView('list')}>취소</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? '제출 중...' : '제출하기'}</Button>
          </DialogFooter>
        </>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
