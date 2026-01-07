"use client";

import Task from './Task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TaskList({ tasks, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">No tasks yet!</CardTitle>
          <CardDescription className="mt-2">Add a new task to get started.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Task key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
