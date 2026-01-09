import axios from 'axios';

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
  // Remove /api suffix since we'll add it explicitly in the calls
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.endsWith('/api')) {
    return envUrl.slice(0, -4); // Remove '/api' suffix
  }
  return envUrl || 'https://hamza-todo-backend.vercel.app'; // Base URL without /api
};

const BASE_URL = getBaseURL();

console.log('Task Service Base URL:', BASE_URL);

export interface TaskData {
  title: string;
  is_completed: boolean;
  priority?: string;
  due_date?: string;
}

export interface Task extends TaskData {
  id: number;
  priority: string;
  due_date?: string;
  updated_at?: string;
}

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor to include auth token and handle data transformation
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';

    // Transform request data to ensure proper format for backend
    if (config.data && config.method === 'post') {
      // Convert date objects to ISO strings for task creation
      if (config.data.due_date && config.data.due_date instanceof Date) {
        config.data.due_date = config.data.due_date.toISOString();
      }
    }

    if (config.data && config.method === 'put') {
      // Convert date objects to ISO strings for task updates
      if (config.data.due_date && config.data.due_date instanceof Date) {
        config.data.due_date = config.data.due_date.toISOString();
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
  return apiClient.get<Task[]>('/api/tasks');
};

export const createTask = (task: TaskData) => {
  return apiClient.post<Task>('/api/tasks', task);
};

export const updateTask = (taskId: number, updatedTask: TaskData) => {
  return apiClient.put<Task>(`/api/tasks/${taskId}`, updatedTask);
};

export const deleteTask = (taskId: number) => {
  return apiClient.delete(`/api/tasks/${taskId}`);
};