'use client';

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft } from "lucide-react";

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
    const { theme, setTheme } = useTheme();

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
                    {/* Font size setting will go here in the future */}
                </div>
            </main>
        </div>
    );
}
