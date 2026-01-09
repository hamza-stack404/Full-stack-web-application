"use client";

import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const AddTaskForm = forwardRef<any, { onAdd: (task: { title: string; is_completed: boolean; priority: string, due_date?: string }) => Promise<void> }>(({ onAdd }, ref) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [date, setDate] = useState<Date | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      // Convert Date object to ISO string for API
      const dueDateStr = date ? date.toISOString() : undefined;
      await onAdd({ title, is_completed: false, priority, due_date: dueDateStr });
      setTitle('');
      setDate(undefined);
      toast.success("Task added successfully!");
    } catch (error) {
      toast.error("Failed to add task.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <Input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        className="input-field flex-1"
      />
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
        <Plus className="h-4 w-4" />
        Add
      </Button>
    </form>
  );
});

AddTaskForm.displayName = 'AddTaskForm';

export default AddTaskForm;
