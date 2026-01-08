import axios, { AxiosError } from 'axios';

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
  // Remove /api suffix since we'll add it explicitly in the calls
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.endsWith('/api')) {
    return envUrl.slice(0, -4); // Remove '/api' suffix
  }
  return 'https://hamza-todo-backend.vercel.app'; // Base URL without /api
};

const BASE_URL = getBaseURL();

console.log('Auth Service Base URL:', BASE_URL);

// Create axios instance for auth requests
const authClient = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor to handle development vs production paths
authClient.interceptors.request.use(
  (config) => {
    // For development, ensure we're using the correct path structure
    if (isDevelopment) {
      if (config.url && !config.url.startsWith('/')) {
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
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Auth API Error:', error.response || error.message || error);
    return Promise.reject(error);
  }
);

export const signup = async (username: string, email: string, password: string) => {
  try {
    const url = isDevelopment ? '/api/signup' : '/signup';
    const response = await authClient.post(url, {
      username,
      email,
      password
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      console.error('Signup error response:', error.response);
      throw error;
    } else if (error.request) {
      // Request made but no response
      console.error('Signup error - no response:', error.request);
      throw new Error('No response from server during signup');
    } else {
      console.error('Signup generic error:', error.message);
      throw new Error(error.message || 'Signup failed');
    }
  }
};

export const login = async (email: string, password: string) => {
  try {
    const url = isDevelopment ? '/api/login' : '/login';
    const response = await authClient.post(url, new URLSearchParams({
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
      console.error('Login error response:', error.response);
      throw error;
    } else if (error.request) {
      // Request made but no response
      console.error('Login error - no response:', error.request);
      throw new Error('No response from server during login');
    } else {
      console.error('Login generic error:', error.message);
      throw new Error(error.message || 'Login failed');
    }
  }
};
