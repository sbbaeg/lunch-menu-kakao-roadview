'use client';

import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore, FontSize } from '@/store/useAppStore';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">앱 설정</h3>
            <Button variant="ghost" className="justify-between w-full p-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <span className="text-sm font-medium">테마 변경</span>
                <ThemeToggle />
            </Button>
        </div>
        <div className="py-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">글자 크기</h3>
            <ToggleGroup 
                type="single" 
                defaultValue={fontSize}
                onValueChange={(value: FontSize) => {
                    if (value) setFontSize(value);
                }}
                className="w-full grid grid-cols-3"
            >
                <ToggleGroupItem value="normal" aria-label="보통 크기">
                    보통
                </ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="큰 크기">
                    크게
                </ToggleGroupItem>
                <ToggleGroupItem value="xlarge" aria-label="아주 큰 크기">
                    더 크게
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
