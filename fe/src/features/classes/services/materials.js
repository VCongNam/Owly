import apiClient from '../../../services/apiClient';

export const materialService = {
  getClassMaterials: async (classId, params = {}) => {
    return await apiClient.get(`/api/classes/${classId}/materials`, { params });
  },

  uploadMaterial: async (classId, formData) => {
    return await apiClient.post(`/api/classes/${classId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  deleteMaterial: async (id) => {
    return await apiClient.delete(`/api/materials/${id}`);
  }
};
