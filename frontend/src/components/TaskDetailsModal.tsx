"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date?: string;
}

interface TaskDetailsModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, isOpen, onClose }: TaskDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Task Details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Priority</h3>
            <p className="text-sm text-muted-foreground">{task.priority}</p>
          </div>
          {task.due_date && (
            <div>
              <h3 className="font-semibold">Due Date</h3>
              <p className="text-sm text-muted-foreground">{format(new Date(task.due_date), "MMM d, yyyy")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
