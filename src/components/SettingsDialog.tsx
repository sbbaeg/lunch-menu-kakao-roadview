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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] p-4 border-t border-b">
          <AppSettings />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
