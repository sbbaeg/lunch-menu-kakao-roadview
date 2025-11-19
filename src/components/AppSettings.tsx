'use client';

import { useState } from 'react';
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

// Mock data for notification settings
const notificationSettings = [
  { id: 'reviewUpvote', label: '내 리뷰에 추천', description: '다른 사용자가 내 리뷰를 추천했을 때 알림을 받습니다.' },
  { id: 'bestReview', label: '베스트 리뷰 선정', description: '내 리뷰가 베스트 리뷰로 선정되었을 때 알림을 받습니다.' },
  { id: 'newBadge', label: '신규 뱃지 획득', description: '새로운 뱃지를 획득했을 때 알림을 받습니다.' },
  { id: 'inquiryReply', label: '관리자 문의 답변', description: '관리자 문의에 답변이 등록되었을 때 알림을 받습니다.' },
];

export function AppSettings() {
  const { theme, setTheme } = useTheme();
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);

  // For now, notification toggles are managed with local state
  const [notifications, setNotifications] = useState({
    reviewUpvote: true,
    bestReview: true,
    newBadge: true,
    inquiryReply: true,
  });

  const handleNotificationChange = (id: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetSettings = () => {
    // This will be implemented later. For now, just show a toast.
    setFontSize('normal');
    toast.success("모든 설정이 초기화되었습니다.");
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
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setTheme('light')}>Light</Button>
                <Button variant="outline" size="sm" onClick={() => setTheme('dark')}>Dark</Button>
            </div>
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
                defaultValue={fontSize}
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
          {notificationSettings.map(setting => (
            <div key={setting.id} className="flex items-center justify-between">
              <Label htmlFor={setting.id} className="flex flex-col space-y-1">
                <span>{setting.label}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {setting.description}
                </span>
              </Label>
              <Switch
                id={setting.id}
                checked={notifications[setting.id as keyof typeof notifications]}
                onCheckedChange={() => handleNotificationChange(setting.id as keyof typeof notifications)}
              />
            </div>
          ))}
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
