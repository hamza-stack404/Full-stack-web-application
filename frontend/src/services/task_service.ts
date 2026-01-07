import axios from 'axios';

const API_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
  }
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export const getTasks = () => {
  return axios.get(`${API_URL}/tasks`, getAuthHeaders());
};
export const createTask = (task) => {
  return axios.post(`${API_URL}/tasks`, task, getAuthHeaders());
};

export const updateTask = (taskId, updatedTask) => {
  return axios.put(`${API_URL}/tasks/${taskId}`, updatedTask, getAuthHeaders());
};

export const deleteTask = (taskId) => {
  return axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeaders());
};