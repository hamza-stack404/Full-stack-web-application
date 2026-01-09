'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import AddTaskForm from '@/src/components/AddTaskForm';

interface FloatingActionButtonProps {
  onAddTask: (task: { title: string; is_completed: boolean; priority: string; due_date: Date | undefined }) => Promise<void>;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAddTask = async (task: { title: string; is_completed: boolean; priority: string; due_date: Date | undefined }) => {

      await onAddTask(task);

      setShowModal(false);

    };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          size="icon"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <AddTaskForm onAdd={handleAddTask} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActionButton;