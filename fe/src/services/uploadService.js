import apiClient from './apiClient';

export const uploadService = {
  uploadFiles: async (files, folder) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (folder) {
      formData.append('folder', folder);
    }
    return await apiClient.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
