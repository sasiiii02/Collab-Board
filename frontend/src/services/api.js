import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Workspaces
export const getWorkspaces = () => api.get('/workspaces');
export const createWorkspace = (data) => api.post('/workspaces', data);
export const getWorkspace = (id) => api.get(`/workspaces/${id}`);
export const joinWorkspace = (token) => api.post(`/workspaces/join/${token}`);

// Tasks
export const getTasks = (workspaceId) => api.get(`/tasks/${workspaceId}`);
export const createTask = (workspaceId, data) => api.post(`/tasks/${workspaceId}`, data);
export const updateTask = (taskId, data) => api.patch(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const addComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);

export default api;