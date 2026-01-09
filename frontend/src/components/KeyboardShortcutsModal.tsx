"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function KeyboardShortcutsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Add New Task</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Ctrl</span>+<span className="text-xs">N</span>
              </kbd>
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Cancel Action</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Esc</span>
              </kbd>
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Navigate Down</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">↓</span>
              </kbd>
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Navigate Up</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">↑</span>
              </kbd>
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Select Task</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Enter</span>
              </kbd>
            </p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p>Delete Task</p>
            <p className="text-sm text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Delete</span>
              </kbd>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
