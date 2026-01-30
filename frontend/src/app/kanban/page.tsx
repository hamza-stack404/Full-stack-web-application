"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/task_service';
import { logout } from '../../services/auth_service';
import { useError } from '../../providers/ErrorProvider';
import ThemeToggle from '../../components/ThemeToggle';
import { LogOut, Menu } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import KanbanBoard from '../../components/KanbanBoard';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import GlobalSearchModal from '@/components/GlobalSearchModal';

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
      detail?: string;
    };
  };
  message?: string;
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError } = useError();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
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

        // If unauthorized (401/403), redirect to login
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          router.push('/login');
          return;
        }

        setError(apiError?.response?.data?.message || 'Failed to fetch tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [setError, router]);

  const handleUpdate = async (id: number, updatedTask: TaskItem) => {
    const originalTasks = tasks;
    setTasks(tasks.map((task: TaskItem) => (task.id === id ? updatedTask : task)));

    try {
      const { id: taskId, updated_at, ...taskForApi } = updatedTask;
      await updateTask(taskId, taskForApi);
    } catch (err: unknown) {
      setTasks(originalTasks);
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message ||
                          apiError?.response?.data?.detail ||
                          apiError?.message ||
                          'Failed to update task';
      setError(errorMessage);
      console.error('Update task error:', err);
    }
  };

  const handleAdd = async (newTask: { title: string; is_completed: boolean; priority: string, category?: string, due_date?: string }) => {
    const tempId = Date.now();
    const optimisticTask: TaskItem = { ...newTask, id: tempId, subtasks: [] };
    setTasks([...tasks, optimisticTask]);

    try {
      const response = await createTask(newTask);
      setTasks(tasks => tasks.map(t => t.id === tempId ? { ...(response.data as TaskItem), subtasks: response.data.subtasks || [] } : t));
    } catch (err: unknown) {
      setTasks(tasks => tasks.filter(t => t.id !== tempId));
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message ||
                          apiError?.response?.data?.detail ||
                          apiError?.message ||
                          'Failed to add task';
      setError(errorMessage);
      console.error('Add task error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const originalTasks = tasks;
    setTasks(tasks.filter((task: TaskItem) => task.id !== id));

    try {
      await deleteTask(id);
    } catch (err: unknown) {
      setTasks(originalTasks);
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message ||
                          apiError?.response?.data?.detail ||
                          apiError?.message ||
                          'Failed to delete task';
      setError(errorMessage);
      console.error('Delete task error:', err);
    }
  };
  const handleLogout = async () => {
    await logout();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, colIndex) => (
                <div key={colIndex} className="flex flex-col h-full">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-48 w-full" />
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
              <h1 className="text-2xl font-bold">Kanban Board</h1>
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
          
          <KanbanBoard 
            tasks={tasks} 
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-900 text-red-800 dark:text-red-200 mt-4">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}