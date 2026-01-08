import axios from 'axios';

// Use environment variable or construct from current domain
const getAPIUrl = () => {
  // Client-side check
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    // For production Vercel apps, use the backend Vercel URL
    return 'https://hamza-todo-backend.vercel.app/api';
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_API_URL || 'https://hamza-todo-backend.vercel.app/api';
};

const API_URL = getAPIUrl();

console.log('Task Service API URL:', API_URL);

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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
  }
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const getTasks = () => {
  return axios.get<Task[]>(`${API_URL}/tasks`, getAuthHeaders());
};

export const createTask = (task: TaskData) => {
  return axios.post<Task>(`${API_URL}/tasks`, task, getAuthHeaders());
};

export const updateTask = (taskId: number, updatedTask: TaskData) => {
  return axios.put<Task>(`${API_URL}/tasks/${taskId}`, updatedTask, getAuthHeaders());
};

export const deleteTask = (taskId: number) => {
  return axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeaders());
};