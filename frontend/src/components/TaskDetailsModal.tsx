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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.category || 'none');
  const [editedDate, setEditedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  // Reset edit state when task changes or modal opens
  useEffect(() => {
    setSubtasks(task.subtasks);
    setEditedTitle(task.title);
    setEditedPriority(task.priority);
    setEditedCategory(task.category || 'none');
    setEditedDate(task.due_date ? new Date(task.due_date) : undefined);
    setIsEditMode(false);
  }, [task, isOpen]);

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

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    try {
      const updatedTask: TaskItem = {
        ...task,
        title: editedTitle,
        priority: editedPriority,
        category: editedCategory === 'none' ? undefined : editedCategory,
        due_date: editedDate ? editedDate.toISOString() : undefined,
        subtasks
      };

      await onUpdate(task.id, updatedTask);
      setIsEditMode(false);
      toast.success("Task updated successfully!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(task.title);
    setEditedPriority(task.priority);
    setEditedCategory(task.category || 'none');
    setEditedDate(task.due_date ? new Date(task.due_date) : undefined);
    setIsEditMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {isEditMode ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Task title..."
              />
            ) : (
              <DialogTitle>{task.title}</DialogTitle>
            )}
            {!isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="ml-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogDescription>
            {isEditMode ? 'Edit task details' : 'Task Details'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {isEditMode ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Priority</h3>
                  <Select value={editedPriority} onValueChange={setEditedPriority}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <Select value={editedCategory} onValueChange={setEditedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Due Date</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedDate ? format(editedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedDate}
                        onSelect={setEditedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold">Priority</h3>
                  <p className="text-sm text-muted-foreground capitalize">{task.priority}</p>
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
              </>
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
