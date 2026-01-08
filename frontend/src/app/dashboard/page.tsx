"use client";

import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../../services/task_service';
import { useError } from '../../providers/ErrorProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, format } from 'date-fns';

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

  useEffect(() => {
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
  }, [setError]);

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
    );
  }

  return (
    <div className="container mx-auto p-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
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
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
