import apiClient from '../../../services/apiClient';

export const tuitionService = {
  // 1. Cấu hình đơn giá học phí
  getClassTuitionConfig: async (classId) => {
    return await apiClient.get(`/api/classes/${classId}/tuition-config`);
  },

  updateClassTuitionConfig: async (classId, data) => {
    return await apiClient.put(`/api/classes/${classId}/tuition-config`, data);
  },

  // 2. Phát hành & Xem danh sách hóa đơn theo lớp
  generateMonthlyInvoices: async (classId, data) => {
    return await apiClient.post(`/api/classes/${classId}/invoices/generate`, data);
  },

  getClassInvoices: async (classId, params = {}) => {
    return await apiClient.get(`/api/classes/${classId}/invoices`, { params });
  },

  // 3. Học sinh xem hóa đơn & Nộp minh chứng
  getStudentInvoices: async () => {
    return await apiClient.get('/api/tuition/my-invoices');
  },

  submitPaymentProof: async (invoiceId, data) => {
    return await apiClient.post(`/api/tuition/invoices/${invoiceId}/submit-proof`, data);
  },

  // 4. Giáo viên duyệt / từ chối giao dịch
  reviewTransaction: async (transactionId, data) => {
    return await apiClient.patch(`/api/tuition/transactions/${transactionId}/review`, data);
  },

  getTeacherPendingInvoices: async () => {
    return await apiClient.get('/api/tuition/teacher/pending');
  },
};

export default tuitionService;
