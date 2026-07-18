import { useState, useCallback } from 'react';
import { attendanceApi } from '../services/attendanceApi';
import { notifications } from '@mantine/notifications';

export const useGetAttendances = (sessionId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchAttendances = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await attendanceApi.getAttendancesBySession(sessionId);
      setData(response);
    } catch (err) {
      setIsError(true);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách điểm danh.',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { data, isLoading, isError, refetch: fetchAttendances };
};

export const useUpsertAttendances = (sessionId) => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (attendances, options) => {
    setIsPending(true);
    try {
      await attendanceApi.upsertAttendances(sessionId, attendances);
      notifications.show({
        title: 'Thành công',
        message: 'Lưu điểm danh thành công!',
        color: 'green'
      });
      if (options?.onSuccess) {
        options.onSuccess();
      }
    } catch (err) {
      notifications.show({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi lưu điểm danh',
        color: 'red'
      });
      if (options?.onError) {
        options.onError(err);
      }
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
