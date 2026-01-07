"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2Icon } from "lucide-react";

export default function Task({ task, onUpdate, onDelete }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.is_completed}
          onCheckedChange={() => onUpdate(task.id, { ...task, is_completed: !task.is_completed })}
        />
        <label
          htmlFor={`task-${task.id}`}
          className={`text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {task.title}
        </label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
      >
        <Trash2Icon className="h-5 w-5 text-red-500" />
      </Button>
    </Card>
  );
}