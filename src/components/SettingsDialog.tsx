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

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();

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
            {/* Font size setting will go here in the future */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
