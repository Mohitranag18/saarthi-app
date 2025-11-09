import axios from 'axios';
import { storage } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

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
    // Check if there's a photo to upload
    if (data.photo && (data.photo.startsWith('file://') || data.photo.startsWith('content://'))) {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Append all fields
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('problem_type', data.problem_type);
      
      // Handle disability_types array - for React Native, send as comma-separated string
      if (Array.isArray(data.disability_types)) {
        formData.append('disability_types', data.disability_types.join(','));
      } else {
        formData.append('disability_types', data.disability_types);
      }
      
      formData.append('severity', data.severity);
      formData.append('description', data.description);
      
      // Append photo file if exists - React Native specific handling
      if (data.photo) {
        const photoUri = data.photo;
        let photoName = photoUri.split('/').pop() || 'photo.jpg';
        let photoType = 'image/jpeg';
        
        // Extract file extension to determine proper MIME type
        const fileExtension = photoName.split('.').pop()?.toLowerCase();
        switch (fileExtension) {
          case 'png':
            photoType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            photoType = 'image/jpeg';
            break;
          case 'gif':
            photoType = 'image/gif';
            break;
          case 'webp':
            photoType = 'image/webp';
            break;
          default:
            photoType = 'image/jpeg';
        }
        
        // Ensure we have a valid filename
        if (!photoName.includes('.')) {
          photoName = `photo.${fileExtension || 'jpg'}`;
        }
        
        // React Native FormData requires the file object differently
        formData.append('photo', {
          uri: photoUri,
          type: photoType,
          name: photoName,
        });
      }
      
      // Make request with FormData - remove default Content-Type to let axios set it with boundary
      const response = await api.post('/reports/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Prevent axios from trying to stringify FormData
      });
      return response.data;
    } else {
      // Regular JSON request without photo
      const response = await api.post('/reports/', data);
      return response.data;
    }
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
