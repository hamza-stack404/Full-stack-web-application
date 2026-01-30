"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTasks, createTask, updateTask, deleteTask } from '@/src/services/task_service';
import { logout } from '@/src/services/auth_service';
import TaskList from '@/src/components/TaskList';
import AddTaskForm from '@/src/components/AddTaskForm';
import BulkActionsToolbar from '@/src/components/BulkActionsToolbar';
import { useError } from '@/src/providers/ErrorProvider';
import ThemeToggle from '@/src/components/ThemeToggle';
import { LogOut, Menu, Plus, CheckSquare } from 'lucide-react';
import { Tooltip } from '@/src/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WelcomeModal from '@/src/components/WelcomeModal';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import FloatingActionButton from '@/components/FloatingActionButton';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import { requestNotificationPermission, checkUpcomingTasks, showTaskCompletedNotification, showTaskCreatedNotification } from '@/lib/notifications';
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts';
import { useKeyboardNavigation } from '@/src/hooks/useKeyboardNavigation';
import KeyboardShortcutsModal from '@/src/components/KeyboardShortcutsModal';
import { toast } from 'sonner';

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
  tags?: string[];
  due_date?: string;
  subtasks: Subtask[];
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

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError } = useError();
  const router = useRouter();
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const addTaskFormRef = useRef<HTMLDivElement>(null);
  const addTaskInputRef = useRef<HTMLInputElement>(null);

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

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'none') {
        filtered = filtered.filter(task => !task.category);
      } else {
        filtered = filtered.filter(task => task.category === categoryFilter);
      }
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
  }, [tasks, priorityFilter, categoryFilter, sortBy, searchTerm]);


  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+n': () => {
      addTaskInputRef.current?.focus();
    },
    'escape': () => {
      setSelectedTaskIndex(null);
      resetFocus();
    },
    'delete': () => {
      if (focusedIndex !== null && filteredAndSortedTasks[focusedIndex]) {
        handleDelete(filteredAndSortedTasks[focusedIndex].id);
      }
    }
  });

  // Keyboard navigation for tasks
  const { focusedIndex, handleKeyDown, resetFocus } = useKeyboardNavigation(
    filteredAndSortedTasks,
    (index) => setSelectedTaskIndex(index)
  );

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkUpcomingTasks(tasks);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFab(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const currentRef = addTaskFormRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getTasks();

        // Ensure response.data is an array before mapping
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response format:', response);
          setTasks([]);
          setLoading(false);
          return;
        }

        const tasksWithSubtasks = response.data.map(task => ({
          ...task,
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

        const errorMessage = apiError?.response?.data?.message ||
                            apiError?.response?.data?.detail ||
                            apiError?.message ||
                            'Failed to fetch tasks';
        setError(errorMessage);
        console.error('Fetch tasks error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    const hasSeenModal = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenModal) {
      setIsWelcomeModalOpen(true);
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
  }, [router, setError]);

  const handleAdd = async (newTask: { title: string; is_completed: boolean; priority: string, category?: string, due_date?: string }) => {
    const tempId = Date.now();
    const optimisticTask: TaskItem = { ...newTask, id: tempId, subtasks: [] };
    setTasks([...tasks, optimisticTask]);

    try {
      const response = await createTask(newTask);
      setTasks(tasks => tasks.map(t => t.id === tempId ? { ...(response.data as TaskItem), subtasks: [] } : t));
      showTaskCreatedNotification(optimisticTask);
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


  const handleUpdate = async (id: number, updatedTask: TaskItem) => {
    const originalTasks = tasks;
    const previousTask = tasks.find(task => task.id === id);
    setTasks(tasks.map((task: TaskItem) => (task.id === id ? updatedTask : task)));

    try {
      // Only send fields that the backend supports
      const { id, ...taskForApi } = updatedTask;
      await updateTask(id, taskForApi);

      // Show notification if task was marked as completed
      if (previousTask && !previousTask.is_completed && updatedTask.is_completed) {
        showTaskCompletedNotification(updatedTask);
      }
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

  // Bulk operations
  const toggleTaskSelection = (taskId: number) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);

    // Auto-enable selection mode when selecting tasks
    if (newSelection.size > 0 && !selectionMode) {
      setSelectionMode(true);
    }
  };

  const selectAllTasks = () => {
    const allTaskIds = new Set(filteredAndSortedTasks.map(task => task.id));
    setSelectedTaskIds(allTaskIds);
    setSelectionMode(true);
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkComplete = async () => {
    const selectedTasks = tasks.filter(task => selectedTaskIds.has(task.id));
    const originalTasks = tasks;

    // Optimistically update UI
    setTasks(tasks.map(task =>
      selectedTaskIds.has(task.id) ? { ...task, is_completed: true } : task
    ));

    try {
      // Update all selected tasks
      await Promise.all(
        selectedTasks.map(task =>
          updateTask(task.id, { ...task, is_completed: true })
        )
      );
      clearSelection();
      toast.success(`Completed ${selectedTasks.length} task(s)`);
    } catch (err: unknown) {
      setTasks(originalTasks);
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message || 'Failed to complete tasks';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    const selectedCount = selectedTaskIds.size;
    const originalTasks = tasks;

    // Optimistically update UI
    setTasks(tasks.filter(task => !selectedTaskIds.has(task.id)));

    try {
      // Delete all selected tasks
      await Promise.all(
        Array.from(selectedTaskIds).map(taskId => deleteTask(taskId))
      );
      clearSelection();
      toast.success(`Deleted ${selectedCount} task(s)`);
    } catch (err: unknown) {
      setTasks(originalTasks);
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message || 'Failed to delete tasks';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBulkChangePriority = async (priority: string) => {
    const selectedTasks = tasks.filter(task => selectedTaskIds.has(task.id));
    const originalTasks = tasks;

    // Optimistically update UI
    setTasks(tasks.map(task =>
      selectedTaskIds.has(task.id) ? { ...task, priority } : task
    ));

    try {
      // Update all selected tasks
      await Promise.all(
        selectedTasks.map(task =>
          updateTask(task.id, { ...task, priority })
        )
      );
      clearSelection();
      toast.success(`Updated priority for ${selectedTasks.length} task(s)`);
    } catch (err: unknown) {
      setTasks(originalTasks);
      const apiError = err as ApiError;
      const errorMessage = apiError?.response?.data?.message || 'Failed to update priority';
      setError(errorMessage);
      toast.error(errorMessage);
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
          <Progress />
          <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setSidebarOpen(true)}
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
          <main className="container mx-auto p-6 space-y-6">
            <div className="card-hover">
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <Skeleton className="h-9 w-[240px]" />
                <Skeleton className="h-9 w-[180px]" />
                <Skeleton className="h-9 w-[180px]" />
                <Skeleton className="h-9 w-[180px]" />
              </div>
            </div>

            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleReorder = (startIndex: number, endIndex: number) => {
    const reorderedTasks = Array.from(tasks);
    const [removed] = reorderedTasks.splice(startIndex, 1);
    reorderedTasks.splice(endIndex, 0, removed);
    setTasks(reorderedTasks);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      {showFab && (
        <Tooltip text="Add tasks">
          <FloatingActionButton onAddTask={handleAdd} />
        </Tooltip>
      )}

      <div className={sidebarOpen ? "md:ml-64" : ""}>
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="heading-2 gradient-text">My Tasks</h1>
              
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <GlobalSearchModal />
              <Tooltip text="Keyboard shortcuts">
                <KeyboardShortcutsModal />
              </Tooltip>
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

        <main className="container mx-auto p-4 sm:p-6 space-y-6 pb-16">
          <Breadcrumbs />

          <div className="card-hover" ref={addTaskFormRef}>
            <h2 className="text-xl font-semibold mb-4">Add a new task</h2>
            <AddTaskForm ref={addTaskInputRef} onAdd={handleAdd} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Tooltip text="Search by task title">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[240px]"
                />
              </Tooltip>
              <Tooltip text="Filter by priority">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Tooltip>
              <Tooltip text="Filter by category">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="none">No Category</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </Tooltip>
              <Tooltip text="Sort by due date">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sorting</SelectItem>
                    <SelectItem value="due_date_asc">Due Date Asc</SelectItem>
                    <SelectItem value="due_date_desc">Due Date Desc</SelectItem>
                  </SelectContent>
                </Select>
              </Tooltip>
              <Tooltip text="Select multiple tasks">
                <button
                  onClick={() => setSelectionMode(!selectionMode)}
                  className={`btn-outline flex items-center gap-2 ${selectionMode ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}`}
                >
                  <CheckSquare className="h-4 w-4" />
                  {selectionMode ? 'Exit Select' : 'Select'}
                </button>
              </Tooltip>
            </div>
          </div>

          <BulkActionsToolbar
            selectedCount={selectedTaskIds.size}
            onComplete={handleBulkComplete}
            onDelete={handleBulkDelete}
            onChangePriority={handleBulkChangePriority}
            onSelectAll={selectAllTasks}
            onClearSelection={clearSelection}
          />

          <div
            className="animate-fadeInUp"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <TaskList
              tasks={filteredAndSortedTasks}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReorder={handleReorder}
              focusedIndex={focusedIndex}
              onKeyDown={handleKeyDown}
              selectionMode={selectionMode}
              selectedTaskIds={selectedTaskIds}
              onToggleSelection={toggleTaskSelection}
            />
          </div>
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-900 text-red-800 dark:text-red-200">
              {error}
            </div>
          )}
          <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
        </main>
      </div>
    </div>
  );
}