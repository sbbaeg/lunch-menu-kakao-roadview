'use client';

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { useAppStore, FontSize } from '@/store/useAppStore';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
    const { theme, setTheme } = useTheme();
    const fontSize = useAppStore((state) => state.fontSize);
    const setFontSize = useAppStore((state) => state.setFontSize);

    return (
        <div className="h-full w-full flex flex-col bg-background">
            <header className="p-4 border-b flex items-center flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold">설정</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-2">
                <div className="px-4 py-4">
                    <h3 className="text-lg font-semibold mb-2">앱 설정</h3>
                    <Button variant="ghost" className="justify-between w-full p-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                        <span className="text-sm font-medium">테마 변경</span>
                        <ThemeToggle />
                    </Button>
                </div>
                <div className="px-4 py-4 mt-4">
                    <h3 className="text-lg font-semibold mb-2">글자 크기</h3>
                    <ToggleGroup 
                        type="single" 
                        defaultValue={fontSize}
                        onValueChange={(value: FontSize) => {
                            if (value) setFontSize(value);
                        }}
                        className="w-full grid grid-cols-4"
                    >
                        <ToggleGroupItem value="small" aria-label="작은 크기">
                            작게
                        </ToggleGroupItem>
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
            </main>
        </div>
    );
}
