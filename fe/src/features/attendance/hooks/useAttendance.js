import { useState, useEffect } from 'react';
import { attendanceApi } from '../services/attendanceApi';
import { notifications } from '@mantine/notifications';

export const useGetAttendances = (sessionId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !!sessionId);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    const performFetch = async () => {
      try {
        const response = await attendanceApi.getAttendancesBySession(sessionId);
        if (active) setData(response);
      } catch {
        if (active) {
          setIsError(true);
          notifications.show({
            title: 'Lỗi',
            message: 'Không thể tải danh sách điểm danh.',
            color: 'red'
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    performFetch();

    return () => {
      active = false;
    };
  }, [sessionId]);

  return { data, isLoading, isError };
};

export const useUpsertAttendances = (sessionId) => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (attendances, options) => {
    setIsPending(true);
    try {
      await attendanceApi.upsertAttendances(sessionId, attendances);
    } catch (err) {
      setIsPending(false);
      notifications.show({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi lưu điểm danh',
        color: 'red'
      });
      if (options?.onError) {
        options.onError(err);
      }
      return;
    }

    setIsPending(false);
    notifications.show({
      title: 'Thành công',
      message: 'Lưu điểm danh thành công!',
      color: 'green'
    });
    if (options?.onSuccess) {
      options.onSuccess();
    }
  };

  return { mutate, isPending };
};
