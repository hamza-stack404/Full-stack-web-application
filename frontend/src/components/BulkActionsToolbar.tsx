"use client";

import { CheckCircle, Trash2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onChangePriority: (priority: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsToolbar({
  selectedCount,
  onComplete,
  onDelete,
  onChangePriority,
  onSelectAll,
  onClearSelection
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-slate-900 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 p-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Select All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onComplete}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>

            <Select onValueChange={onChangePriority}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Set Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
