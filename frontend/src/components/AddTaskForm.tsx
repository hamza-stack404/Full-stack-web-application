"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    onAdd({ title, is_completed: false });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-4">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Buy milk"
        className="flex-grow" // Apply flex-grow directly if needed, or adjust parent
      />
      <Button type="submit">
        Add Task
      </Button>
    </form>
  );
}
