import apiClient from '../../../services/apiClient';

export const feedbackService = {
  createFeedback: async (data) => {
    return await apiClient.post('/api/feedbacks', data);
  },

  getMyFeedbacks: async () => {
    return await apiClient.get('/api/feedbacks/my');
  }
};
