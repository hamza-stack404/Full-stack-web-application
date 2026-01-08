import axios, { AxiosError } from 'axios';

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

console.log('API URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const signup = async (username: string, email: string, password: string) => {
  try {
    const response = await axiosInstance.post('/signup', { username, email, password });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      throw error;
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Signup failed');
    }
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post('/login', new URLSearchParams({
      username: email,
      password: password,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      throw error;
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Login failed');
    }
  }
};
