import axios from 'axios';

// Determine if we're in development or production
const isDevelopment = typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1');

// Use relative paths for development (with Next.js rewrites) and absolute for production
const getBaseURL = () => {
  if (isDevelopment) {
    // For development, use relative paths that will be rewritten by Next.js
    return '';
  }

  // For production, use the environment variable or fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://hamza-todo-backend.vercel.app/api';
};

const BASE_URL = getBaseURL();

console.log('Task Service Base URL:', BASE_URL);

interface TaskData {
  title: string;
  is_completed: boolean;
}

interface Task extends TaskData {
  id: number;
  priority: string;
  due_date?: string;
  updated_at?: string;
}

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';

    // For development, ensure we're using relative paths
    if (isDevelopment) {
      // If the URL starts with '/', it's already relative
      if (!config.url?.startsWith('/')) {
        config.url = `/${config.url}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error.message || error);
    return Promise.reject(error);
  }
);

export const getTasks = () => {
  return apiClient.get<Task[]>(isDevelopment ? '/api/tasks' : '/tasks');
};

export const createTask = (task: TaskData) => {
  return apiClient.post<Task>(isDevelopment ? '/api/tasks' : '/tasks', task);
};

export const updateTask = (taskId: number, updatedTask: TaskData) => {
  return apiClient.put<Task>(isDevelopment ? `/api/tasks/${taskId}` : `/tasks/${taskId}`, updatedTask);
};

export const deleteTask = (taskId: number) => {
  return apiClient.delete(isDevelopment ? `/api/tasks/${taskId}` : `/tasks/${taskId}`);
};