"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Task from './Task';
import { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  category?: string;
  due_date?: string;
  subtasks: Subtask[];
}

export default function TaskList({
  tasks,
  onUpdate,
  onDelete,
  onReorder,
  focusedIndex,
  onKeyDown
}: {
  tasks: TaskItem[];
  onUpdate: (id: number, task: TaskItem) => Promise<void> | void;
  onDelete: (id: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  focusedIndex: number | null;
  onKeyDown?: (e: KeyboardEvent) => void;
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div onKeyDown={onKeyDown}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={index === focusedIndex ? 'ring-2 ring-blue-500' : ''}
                    >
                      <Task
                        task={task}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        isFocused={index === focusedIndex}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
