import axios, { AxiosError } from 'axios';

const API_URL = '/api';

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
