import axios from 'axios';
import { storage } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

export const reportAPI = {
  getAll: async (params) => {
    const response = await api.get('/reports/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reports/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/reports/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/reports/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/reports/${id}/`);
    return response.data;
  },
};

export const routeAPI = {
  calculate: async (data) => {
    const response = await api.post('/routes/calculate/', data);
    return response.data;
  },

  getSafe: async (params) => {
    const response = await api.get('/routes/safe/', { params });
    return response.data;
  },

  submitFeedback: async (data) => {
    const response = await api.post('/routes/feedback/', data);
    return response.data;
  },
};

export const weatherAPI = {
  getCurrent: async (lat, lon) => {
    const response = await api.get('/weather/', { params: { lat, lon } });
    return response.data;
  },
};

export default api;
