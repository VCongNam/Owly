import apiClient from '../../../services/apiClient';

export const profileService = {
  getProfile: async () => {
    return await apiClient.get('/api/profile');
  },

  updateProfile: async (data) => {
    return await apiClient.put('/api/profile', data);
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return await apiClient.post('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
