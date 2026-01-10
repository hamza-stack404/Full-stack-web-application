"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks } from '../../services/task_service';
import { useError } from '../../providers/ErrorProvider';
import ThemeToggle from '../../components/ThemeToggle';
import { LogOut, Menu } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import CalendarView from '../../components/CalendarView';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import TaskDetailsModal from '@/src/components/TaskDetailsModal';

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
  updated_at?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { error, setError } = useError();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await getTasks();
        const tasksWithSubtasks = response.data.map(task => ({
          ...task,
          priority: task.priority || 'low',
          subtasks: task.subtasks || [],
        }));
        setTasks(tasksWithSubtasks);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError?.response?.data?.message || 'Failed to fetch tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [setError, router]);

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdate = (id: number, updatedTask: TaskItem) => {
    setTasks(tasks.map(task => task.id === id ? updatedTask : task));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className={sidebarOpen ? "md:ml-64" : ""}>
          <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </header>
          <div className="container mx-auto p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-7 gap-0">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-8 mb-1" />
              ))}
              {[...Array(5)].map((_, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-0">
                  {[...Array(7)].map((_, dayIndex) => (
                    <Skeleton key={dayIndex} className="h-32 m-0" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={sidebarOpen ? "md:ml-64" : ""}>
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold">Calendar View</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <GlobalSearchModal />
              <Tooltip text="Toggle theme">
                <ThemeToggle />
              </Tooltip>
              <button
                onClick={handleLogout}
                className="btn-outline flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 pb-16">
          <Breadcrumbs />
          
          <CalendarView tasks={tasks} onTaskClick={handleTaskClick} />
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-900 text-red-800 dark:text-red-200 mt-4">
              {error}
            </div>
          )}
          
          {selectedTask && (
            <TaskDetailsModal 
              task={selectedTask} 
              isOpen={isTaskModalOpen} 
              onClose={() => setIsTaskModalOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}