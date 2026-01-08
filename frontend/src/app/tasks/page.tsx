"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/task_service';
import TaskList from '../../components/TaskList';
import AddTaskForm from '../../components/AddTaskForm';
import { useError } from '../../providers/ErrorProvider';
import ThemeToggle from '../../components/ThemeToggle';
import { LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date?: string;
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
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleAdd = async (newTask: { title: string; is_completed: boolean; priority: string, due_date: Date | undefined }) => {
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

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (sortBy === 'due_date_asc') {
      filtered.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (sortBy === 'due_date_desc') {
      filtered.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
    }

    return filtered;
  }, [tasks, priorityFilter, sortBy, searchTerm]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="heading-2 gradient-text">My Tasks</h1>
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</Link>
          </div>
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

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px]"
            />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Sorting</SelectItem>
                <SelectItem value="due_date_asc">Due Date Asc</SelectItem>
                <SelectItem value="due_date_desc">Due Date Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="animate-fadeInUp">
          <TaskList tasks={filteredAndSortedTasks} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-900 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}