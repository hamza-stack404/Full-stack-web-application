"use client";

import { useState } from 'react';
import TaskDetailsModal from './TaskDetailsModal';
import { FileText } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from 'date-fns';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date?: string;
}

const priorityColors: { [key: string]: { border: string, bg: string } } = {
  high: { border: 'border-red-500', bg: 'bg-red-500' },
  medium: { border: 'border-yellow-500', bg: 'bg-yellow-500' },
  low: { border: 'border-green-500', bg: 'bg-green-500' },
};

export default function Task({ 
  task, 
  onUpdate, 
  onDelete 
}: { 
  task: TaskItem;
  onUpdate: (id: number, task: TaskItem) => void;
  onDelete: (id: number) => void;
}) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete(task.id),
    onSwipedRight: () => onUpdate(task.id, { ...task, is_completed: true }),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <>
      <div {...handlers} onClick={() => setIsDetailsModalOpen(true)} className={`card-hover flex flex-col sm:flex-row items-start sm:items-center justify-between group p-4 gap-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]?.border}`}>
        <div className="flex items-start sm:items-center gap-4 flex-1">
          <FileText className="h-6 w-6 text-slate-400" />
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.is_completed}
              onCheckedChange={() => onUpdate(task.id, { ...task, is_completed: !task.is_completed })}
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
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg 
                       hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400
                       hover:text-red-700 dark:hover:text-red-300"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <TaskDetailsModal task={task} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} />
    </>
  );
}