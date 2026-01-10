"use client";

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Calendar, Clock, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
}

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  category?: string;
  due_date?: string;
  subtasks: Subtask[];
}

interface Column {
  id: string;
  title: string;
  taskIds: number[];
}


interface KanbanBoardProps {
  tasks: Task[];
  onUpdate: (id: number, updatedTask: Task) => Promise<void> | void;
  onDelete: (id: number) => void;
  onAdd: (newTask: { title: string; is_completed: boolean; priority: string, category?: string, due_date?: string }) => void;
}

const priorityColors: { [key: string]: string } = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
};

const categoryColors: { [key: string]: string } = {
  work: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  personal: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  shopping: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  health: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  finance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
};

const columnColors: { [key: string]: string } = {
  todo: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
  inprogress: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
  done: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
};

export default function KanbanBoard({ tasks, onUpdate, onDelete, onAdd }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', taskIds: tasks.filter(t => !t.is_completed).map(t => t.id) },
    { id: 'inprogress', title: 'In Progress', taskIds: [] },
    { id: 'done', title: 'Done', taskIds: tasks.filter(t => t.is_completed).map(t => t.id) },
  ]);

  const [newTaskTitles, setNewTaskTitles] = useState<{[key: string]: string}>({});
  const [isAddingTask, setIsAddingTask] = useState<{[key: string]: boolean}>({});

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);

    // Update task completion status based on column
    if (destination.droppableId === 'done' && !tasks.find(t => t.id === taskId)?.is_completed) {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (taskToUpdate) {
        onUpdate(taskId, { ...taskToUpdate, is_completed: true });
      }
    } else if (destination.droppableId !== 'done' && tasks.find(t => t.id === taskId)?.is_completed) {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (taskToUpdate) {
        onUpdate(taskId, { ...taskToUpdate, is_completed: false });
      }
    }

    // Update columns
    setColumns(prev => {
      const newColumns = [...prev];
      const sourceCol = newColumns.find(col => col.id === source.droppableId);
      const destCol = newColumns.find(col => col.id === destination.droppableId);

      if (sourceCol && destCol) {
        if (sourceCol.id === destCol.id) {
          // Reordering in same column
          const newTaskIds = Array.from(sourceCol.taskIds);
          const [movedTask] = newTaskIds.splice(source.index, 1);
          newTaskIds.splice(destination.index, 0, movedTask);
          sourceCol.taskIds = newTaskIds;
        } else {
          // Moving between columns
          const newSourceTaskIds = Array.from(sourceCol.taskIds);
          const [movedTask] = newSourceTaskIds.splice(source.index, 1);
          sourceCol.taskIds = newSourceTaskIds;

          const newDestTaskIds = Array.from(destCol.taskIds);
          newDestTaskIds.splice(destination.index, 0, movedTask);
          destCol.taskIds = newDestTaskIds;
        }
      }

      return newColumns;
    });
  };

  const handleAddTask = (columnId: string) => {
    const title = newTaskTitles[columnId]?.trim();
    if (!title) return;

    setIsAddingTask(prev => ({ ...prev, [columnId]: true }));

    setTimeout(() => {
      onAdd({ title, is_completed: columnId === 'done', priority: 'medium' });
      setNewTaskTitles(prev => ({ ...prev, [columnId]: '' }));
      setIsAddingTask(prev => ({ ...prev, [columnId]: false }));
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter') {
      handleAddTask(columnId);
    }
  };

  const getTaskById = (id: number) => tasks.find(t => t.id === id);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full">
            <motion.div
              className={`flex items-center justify-between p-4 rounded-t-lg ${columnColors[column.id]}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{column.title}</h3>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                  {column.taskIds.length}
                </span>
              </div>
            </motion.div>

            <div className="p-2 flex-1">
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitles[column.id] || ''}
                    onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [column.id]: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, column.id)}
                    placeholder="Add a task..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddTask(column.id)}
                    disabled={isAddingTask[column.id]}
                    className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isAddingTask[column.id] ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4"
                      >
                        <Clock className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <motion.div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[100px] rounded-b-lg p-2 ${snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                    animate={{
                      backgroundColor: snapshot.isDraggingOver
                        ? 'var(--slate-100)'
                        : 'var(--slate-50)'
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence>
                      {column.taskIds.map((taskId, index) => {
                        const task = getTaskById(taskId);
                        if (!task) return null;

                        return (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-3"
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: snapshot.isDragging ? -5 : 0
                                }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ y: -2 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <Card className={`bg-white dark:bg-slate-800 shadow-sm border-l-4 ${
                                  task.priority === 'high' ? 'border-red-500' :
                                  task.priority === 'medium' ? 'border-yellow-500' :
                                  'border-green-500'
                                } ${task.is_completed ? 'opacity-70' : ''}`}>
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-start">
                                      <h4 className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {task.title}
                                      </h4>
                                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {task.priority && (
                                        <div className="flex items-center gap-1">
                                          <Flag className="h-3 w-3" />
                                          <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                          </Badge>
                                        </div>
                                      )}
                                      {task.category && (
                                        <Badge variant="secondary" className={`text-xs ${categoryColors[task.category]}`}>
                                          {task.category}
                                        </Badge>
                                      )}
                                    </div>

                                    {task.due_date && (
                                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                        <Calendar className="h-3 w-3" />
                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}
                          </Draggable>
                        );
                      })}
                    </AnimatePresence>
                    {provided.placeholder}
                  </motion.div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}