"use client";

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

const priorityColors: { [key: string]: string } = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
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
  return (
    <div className="card-hover flex items-center justify-between group">
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.is_completed}
          onCheckedChange={() => onUpdate(task.id, { ...task, is_completed: !task.is_completed })}
          className="w-5 h-5"
        />
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
      </div>
      <div className="flex items-center gap-4">
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarIcon className="h-4 w-4" />
            {format(new Date(task.due_date), "MMM d")}
          </div>
        )}
        <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}></div>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg 
                     hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400
                     hover:text-red-700 dark:hover:text-red-300"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}