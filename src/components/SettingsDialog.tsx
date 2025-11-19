'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppSettings } from "@/components/AppSettings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-6">
          <div className="py-4">
            <AppSettings />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
