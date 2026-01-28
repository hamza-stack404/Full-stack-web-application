import axios, { AxiosError } from 'axios';

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

// Use relative paths for development (with Next.js rewrites) and absolute for production
const getBaseURL = () => {
  // Check if we have a local development URL in environment
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // If environment variable points to localhost, use relative paths for Next.js rewrites
  if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return ''; // Use relative paths that will be rewritten by Next.js
  }

  // For production, use the environment variable
  if (envUrl) {
    // Remove /api suffix since we'll add it explicitly in the calls
    if (envUrl.endsWith('/api')) {
      return envUrl.slice(0, -4);
    }
    return envUrl;
  }

  // Fallback to empty string to use relative paths
  return '';
};

const BASE_URL = getBaseURL();

// Create axios instance for auth requests
const authClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Include cookies in requests
});

// Add request interceptor to handle path structure and CSRF token
authClient.interceptors.request.use(
  (config) => {
    // Ensure paths start with / when using relative URLs
    if (BASE_URL === '' && config.url && !config.url.startsWith('/')) {
      config.url = `/${config.url}`;
    }

    // Add CSRF token to headers for state-changing requests
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
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
    return Promise.reject(error);
  }
);

export const signup = async (username: string, email: string, password: string) => {
  try {
    const url = '/api/signup';
    const response = await authClient.post(url, {
      username,
      email,
      password
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      throw error;
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server during signup');
    } else {
      throw new Error(error.message || 'Signup failed');
    }
  }
};

export const login = async (email: string, password: string) => {
  try {
    const url = '/api/login';
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
      throw error;
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server during login');
    } else {
      throw new Error(error.message || 'Login failed');
    }
  }
};
