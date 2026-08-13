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

  createFileFromEditor: async (htmlContent) => {
    return await apiClient.post('/api/assignments/create-file-from-editor', { htmlContent });
  },

  getTeacherUpcomingAssignments: async (params = {}) => {
    return await apiClient.get('/api/assignments/teacher/upcoming', { params });
  },

  submitAssignment: async (assignmentId, data) => {
    return await apiClient.post(`/api/assignments/${assignmentId}/submissions`, data);
  },

  getMySubmission: async (assignmentId) => {
    return await apiClient.get(`/api/assignments/${assignmentId}/my-submission`);
  },

  getAssignmentSubmissions: async (assignmentId) => {
    return await apiClient.get(`/api/assignments/${assignmentId}/submissions`);
  },

  gradeSubmission: async (submissionId, data) => {
    return await apiClient.post(`/api/assignments/submissions/${submissionId}/feedback`, data);
  }
};
