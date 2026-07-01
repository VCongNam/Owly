import apiClient from '../../../services/apiClient';

export const classService = {
  getClasses: async () => {
    return await apiClient.get('/api/classes');
  },

  getClassById: async (id) => {
    return await apiClient.get(`/api/classes/${id}`);
  },

  createClass: async (data) => {
    return await apiClient.post('/api/classes', data);
  },

  updateClass: async (id, data) => {
    return await apiClient.put(`/api/classes/${id}`, data);
  },

  deleteClass: async (id) => {
    return await apiClient.delete(`/api/classes/${id}`);
  }
};
