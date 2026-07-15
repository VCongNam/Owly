import apiClient from '../../../services/apiClient';

export const studentService = {
  // Lấy danh sách học viên của giáo viên (phân trang, tìm kiếm)
  getStudents: async (params) => {
    return await apiClient.get('/api/students', { params });
  },

  // Tìm kiếm học viên trên toàn hệ thống (để thêm học viên có sẵn vào lớp)
  searchDirectory: async (q) => {
    return await apiClient.get('/api/students/search-directory', { params: { q } });
  },

  // Học sinh tự cập nhật thông tin cá nhân
  updateSelfProfile: async (data) => {
    return await apiClient.put('/api/students/profile/self', data);
  },

  // Lấy danh sách thành viên của một lớp học
  getClassMembers: async (classId, params) => {
    return await apiClient.get(`/api/classes/${classId}/members`, { params });
  },

  // Giáo viên ghi danh học viên có sẵn vào lớp
  enrollExisting: async (classId, studentId) => {
    return await apiClient.post(`/api/classes/${classId}/members/enroll-existing`, { studentId });
  },

  // Giáo viên tạo mới học sinh và ghi danh vào lớp
  createAndEnrollNew: async (classId, studentData) => {
    return await apiClient.post(`/api/classes/${classId}/members/create-new`, studentData);
  },

  // Giáo viên hủy liên kết (unenroll) học sinh khỏi lớp
  unenrollStudent: async (classId, studentId) => {
    return await apiClient.delete(`/api/classes/${classId}/members/${studentId}`);
  }
};

export default studentService;
