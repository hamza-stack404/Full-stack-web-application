"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks } from '../../services/task_service';
import { useError } from '../../providers/ErrorProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, format } from 'date-fns';
import { LogOut, Menu } from 'lucide-react';
import { Tooltip } from '@/src/components/ui/tooltip';
import ThemeToggle from '@/src/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import FloatingActionButton from '@/components/FloatingActionButton';
import GlobalSearchModal from '@/components/GlobalSearchModal';

interface TaskItem {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date?: string;
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

export default function Dashboard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [setError, router]);

  const handleAddTask = async (newTask: { title: string; is_completed: boolean; priority: string; due_date: Date | undefined }) => {
    // This function can be implemented to add tasks from the FAB
    console.log('Adding new task:', newTask);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const weeklyCompletionData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const formattedDate = format(date, 'MMM d');
      const completedOnDate = tasks.filter(task =>
        task.is_completed &&
        task.updated_at &&
        format(new Date(task.updated_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;
      data.push({ date: formattedDate, completed: completedOnDate });
    }
    return data;
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="md:ml-64">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="card">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
            </div>
            <div className="card mt-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-[300px] w-full" />
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
                className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold">Dashboard</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Tasks Overview</h2>
              <p>Total tasks: {totalTasks}</p>
              <p>Completed tasks: {completedTasks}</p>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Completion Progress</h2>
              <Progress value={completionPercentage} />
              <p className="text-center mt-2">{completionPercentage.toFixed(2)}% completed</p>
            </div>
          </div>
          <div className="card mt-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Completion</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="completed" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
}
