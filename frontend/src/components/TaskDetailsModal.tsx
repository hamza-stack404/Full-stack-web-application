"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import SubtaskList from './SubtaskList';
import PomodoroTimer from './PomodoroTimer';

interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  category?: string;
  subtasks: Subtask[];
  due_date?: string;
}

interface TaskDetailsModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, updatedTask: TaskItem) => Promise<void> | void;
}

export default function TaskDetailsModal({ task, isOpen, onClose, onUpdate }: TaskDetailsModalProps) {
  const [subtasks, setSubtasks] = useState(task.subtasks);

  // Update subtasks when they change
  useEffect(() => {
    if (JSON.stringify(subtasks) !== JSON.stringify(task.subtasks)) {
      onUpdate(task.id, { ...task, subtasks });
    }
  }, [subtasks, task, onUpdate]);

  const handleAddSubtask = (title: string) => {
    const newSubtask = {
      id: Date.now(),
      title,
      is_completed: false
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const handleUpdateSubtask = (id: number, updatedSubtask: any) => {
    setSubtasks(subtasks.map(st => st.id === id ? updatedSubtask : st));
  };

  const handleDeleteSubtask = (id: number) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Task Details
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Priority</h3>
              <p className="text-sm text-muted-foreground">{task.priority}</p>
            </div>
            {task.category && (
              <div>
                <h3 className="font-semibold">Category</h3>
                <p className="text-sm text-muted-foreground capitalize">{task.category}</p>
              </div>
            )}
            {task.due_date && (
              <div>
                <h3 className="font-semibold">Due Date</h3>
                <p className="text-sm text-muted-foreground">{format(new Date(task.due_date), "MMM d, yyyy")}</p>
              </div>
            )}
            <SubtaskList
              subtasks={subtasks}
              onAdd={handleAddSubtask}
              onUpdate={handleUpdateSubtask}
              onDelete={handleDeleteSubtask}
            />
          </div>
          <div className="flex flex-col items-center justify-center">
            <PomodoroTimer taskTitle={task.title} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
