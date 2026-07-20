import apiClient from '../../../services/apiClient';

export const assignmentService = {
  getAssignments: async (classId, params = {}) => {
    return await apiClient.get(`/api/assignments/class/${classId}`, { params });
  },

  createAssignment: async (data) => {
    return await apiClient.post('/api/assignments', data);
  },

  updateAssignment: async (id, data) => {
    return await apiClient.put(`/api/assignments/${id}`, data);
  },

  deleteAssignment: async (id) => {
    return await apiClient.delete(`/api/assignments/${id}`);
  },

  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return await apiClient.post('/api/assignments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  createFileFromEditor: async (htmlContent) => {
    return await apiClient.post('/api/assignments/create-file-from-editor', { htmlContent });
  }
};
