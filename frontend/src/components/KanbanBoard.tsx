"use client";

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  category?: string;
  due_date?: string;
  subtasks?: any[];
}

interface Column {
  id: string;
  title: string;
  taskIds: number[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate: (id: number, updatedTask: Task) => void;
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

export default function KanbanBoard({ tasks, onUpdate, onDelete, onAdd }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', taskIds: tasks.filter(t => !t.is_completed).map(t => t.id) },
    { id: 'inprogress', title: 'In Progress', taskIds: [] },
    { id: 'done', title: 'Done', taskIds: tasks.filter(t => t.is_completed).map(t => t.id) },
  ]);

  const [newTaskTitles, setNewTaskTitles] = useState<{[key: string]: string}>({});

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

    onAdd({ title, is_completed: columnId === 'done', priority: 'medium' });
    setNewTaskTitles(prev => ({ ...prev, [columnId]: '' }));
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
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-t-lg">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{column.title}</h3>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                {column.taskIds.length}
              </span>
            </div>
            
            <div className="p-2">
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitles[column.id] || ''}
                    onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [column.id]: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, column.id)}
                    placeholder="Add a task..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[100px] bg-slate-50 dark:bg-slate-900/50 rounded-b-lg p-2"
                  >
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
                              layout
                              initial={false}
                              animate={{
                                scale: snapshot.isDragging ? 1.02 : 1,
                                boxShadow: snapshot.isDragging 
                                  ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                                  : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                              }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="mb-3"
                            >
                              <Card className={`bg-white dark:bg-slate-800 shadow-sm ${task.is_completed ? 'opacity-70' : ''}`}>
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
                                      <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                      </Badge>
                                    )}
                                    {task.category && (
                                      <Badge variant="secondary" className={`text-xs ${categoryColors[task.category]}`}>
                                        {task.category}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {task.due_date && (
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}