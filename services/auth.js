import api from './api';

export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/users/auth/login/', credentials);
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/users/auth/register/', userData);
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile/');
    return response;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile/', data);
    return response;
  },
};
