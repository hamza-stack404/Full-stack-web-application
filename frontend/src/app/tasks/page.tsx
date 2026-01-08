"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/task_service';
import TaskList from '../../components/TaskList';
import AddTaskForm from '../../components/AddTaskForm';
import { useError } from '../../providers/ErrorProvider';
import ThemeToggle from '../../components/ThemeToggle';
import { LogOut } from 'lucide-react';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError } = useError();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await getTasks();
        setTasks(response.data);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError?.response?.data?.message || 'Failed to fetch tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router, setError]);

  const handleAdd = async (newTask: { title: string; is_completed: boolean }) => {
    try {
      const response = await createTask(newTask);
      setTasks([...tasks, response.data as TaskItem]);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || 'Failed to add task');
      console.error(err);
    }
  };

  const handleUpdate = async (id: number, updatedTask: TaskItem) => {
    try {
      const response = await updateTask(id, updatedTask);
      setTasks(tasks.map((task: TaskItem) => (task.id === id ? (response.data as TaskItem) : task)));
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || 'Failed to update task');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((task: TaskItem) => task.id !== id));
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || 'Failed to delete task');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="heading-2 gradient-text">My Tasks</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
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
      <main className="container mx-auto p-6 space-y-6">
        <div className="card-hover">
          <h2 className="text-xl font-semibold mb-4">Add a new task</h2>
          <AddTaskForm onAdd={handleAdd} />
        </div>
        <div className="animate-fadeInUp">
          <TaskList tasks={tasks} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}