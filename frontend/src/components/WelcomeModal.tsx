"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Your Task Manager!</DialogTitle>
          <DialogDescription>
            Here is a quick overview of the features to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Create and Manage Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Click the "Add a new task" button to create a new task. You can
              set a title, priority, and due date.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Filter and Sort</h3>
            <p className="text-sm text-muted-foreground">
              Use the filters to view tasks by priority and sort them by due
              date.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Navigate to the dashboard to see a summary of your tasks.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
