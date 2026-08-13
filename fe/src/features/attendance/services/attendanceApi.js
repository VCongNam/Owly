import apiClient from '../../../services/apiClient';

export const attendanceApi = {
  getAttendancesBySession: async (sessionId) => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/attendances`);
    return response;
  },

  upsertAttendances: async (sessionId, attendances) => {
    const response = await apiClient.put(`/api/sessions/${sessionId}/attendances`, {
      attendances
    });
    return response;
  }
};
