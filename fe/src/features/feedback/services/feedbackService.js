import apiClient from '../../../services/apiClient';

export const feedbackService = {
  createFeedback: async (data) => {
    return await apiClient.post('/api/feedbacks', data);
  },

  getMyFeedbacks: async () => {
    return await apiClient.get('/api/feedbacks/my');
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    return await apiClient.post('/api/feedbacks/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
