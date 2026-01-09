import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Subtask from './Subtask';

interface SubtaskItem {
  id: number;
  title: string;
  is_completed: boolean;
}

interface SubtaskListProps {
  subtasks: SubtaskItem[];
  onAdd: (title: string) => void;
  onUpdate: (id: number, updatedSubtask: SubtaskItem) => void;
  onDelete: (id: number) => void;
}

export default function SubtaskList({ subtasks, onAdd, onUpdate, onDelete }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAdd = () => {
    if (newSubtaskTitle.trim()) {
      onAdd(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Subtasks</h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({subtasks.filter(st => st.is_completed).length}/{subtasks.length})
        </span>
      </div>
      
      <div className="flex gap-2 mb-2">
        <Input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a subtask..."
          className="h-8 text-sm"
        />
        <Button 
          onClick={handleAdd} 
          size="sm" 
          variant="outline"
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <AnimatePresence>
        {subtasks.map((subtask) => (
          <Subtask
            key={subtask.id}
            subtask={subtask}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}