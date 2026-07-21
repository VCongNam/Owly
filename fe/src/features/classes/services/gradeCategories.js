import apiClient from '../../../services/apiClient';

export const gradeCategoryService = {
  getGradeCategories: async (classId) => {
    return await apiClient.get(`/api/classes/${classId}/grade-categories`);
  },

  createGradeCategory: async (classId, data) => {
    return await apiClient.post(`/api/classes/${classId}/grade-categories`, data);
  }
};
