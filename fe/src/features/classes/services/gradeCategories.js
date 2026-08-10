import apiClient from '../../../services/apiClient';

export const gradeCategoryService = {
  getGradeCategories: async (classId) => {
    return await apiClient.get(`/api/classes/${classId}/grade-categories`);
  },

  createGradeCategory: async (classId, data) => {
    return await apiClient.post(`/api/classes/${classId}/grade-categories`, data);
  },

  updateGradeCategory: async (classId, id, data) => {
    return await apiClient.put(`/api/classes/${classId}/grade-categories/${id}`, data);
  },

  deleteGradeCategory: async (classId, id) => {
    return await apiClient.delete(`/api/classes/${classId}/grade-categories/${id}`);
  }
};
