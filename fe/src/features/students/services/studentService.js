import apiClient from '../../../services/apiClient';

export const studentService = {
  getStudents: async (params) => {
    return await apiClient.get('/api/students', { params });
  },

  searchDirectory: async (q) => {
    return await apiClient.get('/api/students/search-directory', { params: { q } });
  },

  updateSelfProfile: async (data) => {
    return await apiClient.put('/api/students/profile/self', data);
  },

  getClassMembers: async (classId, params) => {
    return await apiClient.get(`/api/classes/${classId}/members`, { params });
  },

  getMyClasses: async () => {
    return await apiClient.get('/api/students/me/classes');
  },

  getMySchedule: async (params = {}) => {
    return await apiClient.get('/api/students/me/schedule', { params });
  },

  enrollExisting: async (classId, studentId) => {
    return await apiClient.post(`/api/classes/${classId}/members/enroll-existing`, { studentId });
  },

  createAndEnrollNew: async (classId, studentData) => {
    return await apiClient.post(`/api/classes/${classId}/members/create-new`, studentData);
  },

  unenrollStudent: async (classId, studentId) => {
    return await apiClient.delete(`/api/classes/${classId}/members/${studentId}`);
  },

  getStudentAttendanceLog: async (classId, studentId) => {
    return await apiClient.get(`/api/classes/${classId}/members/${studentId}/attendance-log`);
  },

  bulkCreateAndEnroll: async (classId, students) => {
    return await apiClient.post(`/api/classes/${classId}/members/bulk-import`, { students });
  }
};

export default studentService;
