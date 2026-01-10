"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import TaskDetailsModal from './TaskDetailsModal';
import { FileText } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
  due_date?: string;
  subtasks: Subtask[];
}

const priorityColors: { [key: string]: { border: string, bg: string } } = {
  high: { border: 'border-red-500', bg: 'bg-red-500' },
  medium: { border: 'border-yellow-500', bg: 'bg-yellow-500' },
  low: { border: 'border-green-500', bg: 'bg-green-500' },
};
const categoryColors: { [key: string]: string } = {
  work: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  personal: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  shopping: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  health: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  finance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
};
export default function Task({
  task,
  onUpdate,
  onDelete,
  isFocused = false
}: {
  task: TaskItem;
  onUpdate: (id: number, task: TaskItem) => Promise<void> | void;
  onDelete: (id: number) => void;
  isFocused?: boolean;
}) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleUpdate = (updatedTask: TaskItem) => {
    onUpdate(task.id, updatedTask);
    toast.success("Task updated successfully!");
  };

  const handleDelete = () => {
    onDelete(task.id);
    toast.success("Task deleted successfully!");
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => handleDelete(),
    onSwipedRight: () => handleUpdate({ ...task, is_completed: true }),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        setIsDetailsModalOpen(true);
        break;
      case 'Delete':
        e.preventDefault();
        handleDelete();
        break;
      case ' ':
        e.preventDefault();
        handleUpdate({ ...task, is_completed: !task.is_completed });
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        // Allow arrow keys to be handled by parent
        break;
      default:
        break;
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        {...handlers}
        onClick={() => setIsDetailsModalOpen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`card-hover flex flex-col sm:flex-row items-start sm:items-center justify-between group p-4 gap-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]?.border} ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-start sm:items-center gap-4 flex-1">
          <FileText className="h-6 w-6 text-slate-400" />
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.is_completed}
              onCheckedChange={() => handleUpdate({ ...task, is_completed: !task.is_completed })}
              className="w-5 h-5 mt-1 sm:mt-0"
            />
            <div className="flex flex-col flex-1">
              <label
                htmlFor={`task-${task.id}`}
                className={`flex-1 text-base leading-none cursor-pointer transition-all duration-200 ${
                  task.is_completed
                    ? 'line-through text-slate-400 dark:text-slate-600'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </label>
              <div className="flex sm:hidden items-center gap-4 mt-2">
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(task.due_date), "MMM d")}
                  </div>
                )}
                {task.category && (
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[task.category] || 'bg-gray-100 dark:bg-gray-700'}`}>
                    {task.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="hidden sm:flex items-center gap-4">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
            {task.category && (
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[task.category] || 'bg-gray-100 dark:bg-gray-700'}`}>
                {task.category}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg
                       hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400
                       hover:text-red-700 dark:hover:text-red-300"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
      <TaskDetailsModal
        task={task}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}