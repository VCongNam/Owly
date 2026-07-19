import apiClient from '../../../services/apiClient';

export const postService = {
  getClassPosts: async (classId, params = {}) => {
    return await apiClient.get(`/api/classes/${classId}/posts`, { params });
  },

  getUpcomingAssignments: async (classId) => {
    return await apiClient.get(`/api/classes/${classId}/upcoming-assignments`);
  },

  createPost: async (classId, formData) => {
    return await apiClient.post(`/api/classes/${classId}/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getPostDetails: async (id) => {
    return await apiClient.get(`/api/posts/${id}`);
  },

  toggleComments: async (id) => {
    return await apiClient.put(`/api/posts/${id}/toggle-comments`);
  },

  deletePost: async (id) => {
    return await apiClient.delete(`/api/posts/${id}`);
  },

  createComment: async (postId, data) => {
    return await apiClient.post(`/api/posts/${postId}/comments`, data);
  },

  deleteComment: async (id) => {
    return await apiClient.delete(`/api/comments/${id}`);
  }
};
export default postService;
