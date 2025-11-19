'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppSettings } from "@/components/AppSettings";

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
    return (
        <div className="h-full w-full flex flex-col bg-background">
            <header className="p-4 border-b flex items-center flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold">설정</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                <AppSettings />
            </main>
        </div>
    );
}
