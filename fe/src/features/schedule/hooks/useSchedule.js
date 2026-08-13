import { useState, useCallback } from 'react';
import { scheduleService } from '../services/scheduleService';
import { notifications } from '@mantine/notifications';

export function useSchedule() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });

  const fetchPersonalSchedule = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      const res = await scheduleService.getPersonalSchedule({ startDate, endDate });
      setSessions(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải lịch học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassSessions = useCallback(async (classId, page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await scheduleService.getClassSessions(classId, { page, limit });
      
      // apiClient response interceptor unpacks to { items: [], pagination }
      const items = res?.items || (Array.isArray(res) ? res : (res?.data || []));
      setSessions(items);

      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải danh sách buổi học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const setupRecurring = async (classId, data) => {
    try {
      setLoading(true);
      const res = await scheduleService.setupRecurringSchedule(classId, data);
      notifications.show({
        title: 'Thành công',
        message: res?.message || 'Đã cấu hình lịch học cố định',
        color: 'green'
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi cấu hình lịch học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (classId, data) => {
    try {
      setLoading(true);
      await scheduleService.createManualSession(classId, data);
      notifications.show({
        title: 'Thành công',
        message: 'Đã tạo buổi học mới',
        color: 'green'
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi tạo buổi học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async (classId, sessionId, data) => {
    try {
      setLoading(true);
      await scheduleService.updateSession(classId, sessionId, data);
      notifications.show({
        title: 'Thành công',
        message: 'Đã cập nhật thông tin buổi học',
        color: 'green'
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi cập nhật buổi học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    loading,
    pagination,
    fetchPersonalSchedule,
    fetchClassSessions,
    setupRecurring,
    createSession,
    updateSession
  };
}
