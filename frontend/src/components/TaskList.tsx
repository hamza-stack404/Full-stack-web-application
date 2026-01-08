"use client";

import Task from './Task';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
}

export default function TaskList({ 
  tasks, 
  onUpdate, 
  onDelete 
}: { 
  tasks: TaskItem[];
  onUpdate: (id: number, task: TaskItem) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No tasks yet!
        </h3>
        <p className="text-muted">
          Add a new task above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Task key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
