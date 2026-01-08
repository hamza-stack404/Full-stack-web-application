"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AddTaskForm({ onAdd }: { onAdd: (task: { title: string; is_completed: boolean }) => Promise<void> }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, is_completed: false });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        className="input-field flex-1"
      />
      <Button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
        <Plus className="h-4 w-4" />
        Add
      </Button>
    </form>
  );
}
