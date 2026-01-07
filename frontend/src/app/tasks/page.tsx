"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/task_service';
import TaskList from '../../components/TaskList';
import AddTaskForm from '../../components/AddTaskForm';
import { useError } from '../../providers/ErrorProvider';
import ThemeToggle from '../../components/ThemeToggle';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
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
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router, setError]);

  const handleAdd = async (newTask) => {
    try {
      const response = await createTask(newTask);
      setTasks([...tasks, response.data]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
      console.error(err);
    }
  };

  const handleUpdate = async (id, updatedTask) => {
    try {
      const response = await updateTask(id, updatedTask);
      setTasks(tasks.map((task) => (task.id === id ? response.data : task)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
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
    <div className="min-h-screen">
      <header className="bg-background border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <div className="bg-card p-6 rounded-lg shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">Add a new task</h2>
          <AddTaskForm onAdd={handleAdd} />
        </div>
        <div className="mt-6">
          <TaskList tasks={tasks} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>
        {error && <div className="mt-4 p-4 bg-destructive text-destructive-foreground rounded-lg">{error}</div>}
      </main>
    </div>
  );
}