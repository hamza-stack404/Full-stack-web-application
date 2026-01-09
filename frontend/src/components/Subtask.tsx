import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Square, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtaskItem {
  id: number;
  title: string;
  is_completed: boolean;
}

interface SubtaskProps {
  subtask: SubtaskItem;
  onUpdate: (id: number, updatedSubtask: SubtaskItem) => void;
  onDelete: (id: number) => void;
}

export default function Subtask({ subtask, onUpdate, onDelete }: SubtaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);

  const handleUpdate = () => {
    if (editTitle.trim()) {
      onUpdate(subtask.id, { ...subtask, title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditTitle(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 pl-6 py-1"
    >
      <Checkbox
        id={`subtask-${subtask.id}`}
        checked={subtask.is_completed}
        onCheckedChange={() => onUpdate(subtask.id, { ...subtask, is_completed: !subtask.is_completed })}
        className="w-4 h-4"
      />
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={handleKeyPress}
          autoFocus
          className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 px-1 py-0.5 text-sm"
        />
      ) : (
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={`flex-1 text-sm cursor-pointer transition-all duration-200 ${
            subtask.is_completed
              ? 'line-through text-slate-400 dark:text-slate-600'
              : 'text-slate-700 dark:text-slate-300'
          }`}
          onDoubleClick={() => setIsEditing(true)}
        >
          {subtask.title}
        </label>
      )}
      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
        aria-label="Delete subtask"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}