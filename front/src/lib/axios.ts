import axios from 'axios';
import { useAppStore } from '../store';

// VITE_API_URL debe ser seteada en Render/Railway. Fallback a locahost para dev.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar JWT
apiClient.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido/expirado, forzar logout local
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
