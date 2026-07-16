import apiClient from '../../../services/apiClient';

export const scheduleService = {
  getPersonalSchedule: async (params = {}) => {
    return await apiClient.get('/api/schedule', { params });
  },

  getClassSessions: async (classId, params = {}) => {
    return await apiClient.get(`/api/classes/${classId}/sessions`, { params });
  },

  setupRecurringSchedule: async (classId, data) => {
    return await apiClient.post(`/api/classes/${classId}/schedules`, data);
  },

  createManualSession: async (classId, data) => {
    return await apiClient.post(`/api/classes/${classId}/sessions`, data);
  },

  updateSession: async (classId, sessionId, data) => {
    return await apiClient.put(`/api/classes/${classId}/sessions/${sessionId}`, data);
  }
};

export default scheduleService;
