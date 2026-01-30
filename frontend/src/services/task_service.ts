import axios from 'axios';

// Helper function to get CSRF token from cookie
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;

  const name = 'csrf_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
};

const isDevelopment = typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1');

// Use relative paths for development (with Next.js rewrites) and absolute for production
const getBaseURL = () => {
  if (isDevelopment) {
    // For development, use relative paths that will be rewritten by Next.js
    return '';
  }

  // For production, use the environment variable
  // Remove /api suffix since we'll add it explicitly in the calls
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    if (envUrl.endsWith('/api')) {
      return envUrl.slice(0, -4); // Remove '/api' suffix
    }
    return envUrl;
  }

  // Fallback to empty string to use relative paths
  return '';
};

const BASE_URL = getBaseURL();

export interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
}

export interface TaskData {
  title: string;
  is_completed: boolean;
  priority?: string;
  due_date?: string;
  category?: string;
  tags?: string[];
  subtasks?: Subtask[];
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
}

export interface Task extends TaskData {
  id: number;
  priority: string;
  due_date?: string;
  category?: string;
  tags?: string[];
  subtasks?: Subtask[];
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  updated_at?: string;
}

// Create axios instance with credentials support for httpOnly cookies
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Include cookies in requests
});

// Add request interceptor to handle data transformation and CSRF token
apiClient.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';

    // Add CSRF token to headers for state-changing requests
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

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
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Redirect to login page if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

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