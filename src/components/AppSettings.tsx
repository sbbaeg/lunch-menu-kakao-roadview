'use client';

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import { useAppStore, FontSize } from '@/store/useAppStore';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";

const notificationSettingMeta = [
  { id: 'notifyOnReviewUpvote', label: '내 리뷰에 추천', description: '다른 사용자가 내 리뷰를 추천했을 때 알림을 받습니다.' },
  { id: 'notifyOnBestReview', label: '베스트 리뷰 선정', description: '내 리뷰가 베스트 리뷰로 선정되었을 때 알림을 받습니다.' },
  { id: 'notifyOnNewBadge', label: '신규 뱃지 획득', description: '새로운 뱃지를 획득했을 때 알림을 받습니다.' },
  { id: 'notifyOnInquiryReply', label: '관리자 문의 답변', description: '관리자 문의에 답변이 등록되었을 때 알림을 받습니다.' },
] as const;

type NotificationSettings = {
  notifyOnReviewUpvote: boolean;
  notifyOnBestReview: boolean;
  notifyOnNewBadge: boolean;
  notifyOnInquiryReply: boolean;
};

export function AppSettings() {
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/users/settings');
        if (!response.ok) {
          throw new Error('설정을 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setSettings(data);
      } catch (e: any) {
        setError(e.message);
        toast.error(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleNotificationChange = async (id: keyof NotificationSettings, checked: boolean) => {
    // Optimistic update
    const originalSettings = settings;
    setSettings(prev => prev ? { ...prev, [id]: checked } : null);

    try {
      const response = await fetch('/api/users/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [id]: checked }),
      });

      if (!response.ok) {
        throw new Error('설정 변경에 실패했습니다.');
      }
      toast.success('알림 설정이 변경되었습니다.');
    } catch (e: any) {
      // Revert on error
      setSettings(originalSettings);
      toast.error(e.message);
    }
  };

  const handleResetSettings = async () => {
    const toastId = toast.loading("설정을 초기화하는 중...");
    try {
        const response = await fetch('/api/users/settings/reset', {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('설정 초기화에 실패했습니다.');
        }

        const data = await response.json();
        // Update local state with the reset data from server
        setSettings({
            notifyOnReviewUpvote: data.settings.notifyOnReviewUpvote,
            notifyOnBestReview: data.settings.notifyOnBestReview,
            notifyOnNewBadge: data.settings.notifyOnNewBadge,
            notifyOnInquiryReply: data.settings.notifyOnInquiryReply,
        });

        // Reset client-side settings
        setFontSize('normal');
        toast.success("모든 설정이 초기화되었습니다.", { id: toastId });
    } catch (e: any) {
        toast.error(e.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      {/* Appearance Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">화면 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="theme-change" className="flex flex-col space-y-1">
              <span>테마 변경</span>
              <span className="font-normal leading-snug text-muted-foreground">
                라이트 모드와 다크 모드를 전환합니다.
              </span>
            </Label>
            <ThemeToggle />
          </div>
          <div className="rounded-lg border p-4">
            <Label className="flex flex-col space-y-1 mb-4">
                <span>글자 크기</span>
                <span className="font-normal leading-snug text-muted-foreground">
                    앱 전체의 글자 크기를 조절합니다.
                </span>
            </Label>
            <ToggleGroup 
                type="single" 
                value={fontSize} // Controlled component
                onValueChange={(value: FontSize) => {
                    if (value) setFontSize(value);
                }}
                className="w-full grid grid-cols-4"
            >
                <ToggleGroupItem value="small" aria-label="작은 크기">작게</ToggleGroupItem>
                <ToggleGroupItem value="normal" aria-label="보통 크기">보통</ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="큰 크기">크게</ToggleGroupItem>
                <ToggleGroupItem value="xlarge" aria-label="아주 큰 크기">더 크게</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">알림 설정</h3>
        <div className="space-y-2 rounded-lg border p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
             <p className="text-sm text-destructive">{error}</p>
          ) : settings ? (
            notificationSettingMeta.map(setting => (
              <div key={setting.id} className="flex items-center justify-between">
                <Label htmlFor={setting.id} className="flex flex-col space-y-1 pr-4">
                  <span>{setting.label}</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    {setting.description}
                  </span>
                </Label>
                <Switch
                  id={setting.id}
                  checked={settings[setting.id]}
                  onCheckedChange={(checked) => handleNotificationChange(setting.id, checked)}
                />
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4">데이터 관리</h3>
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="reset-settings" className="flex flex-col space-y-1">
                    <span>설정 초기화</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        글자 크기 등 모든 설정을 기본값으로 되돌립니다.
                    </span>
                </Label>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" id="reset-settings">초기화</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-sm">
                        <AlertDialogHeader>
                        <AlertDialogTitle>정말로 초기화하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            테마, 글자 크기 등 모든 설정이 기본값으로 변경됩니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetSettings}>확인</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>
    </div>
  );
}