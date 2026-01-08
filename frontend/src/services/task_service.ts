import axios from 'axios';

// Use relative paths for development (with Next.js rewrites) and absolute for production
const getBaseURL = () => {
  // For production, use the environment variable or fallback
  return process.env.NEXT_PUBLIC_API_URL || '';
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