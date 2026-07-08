import { useState, useEffect, useCallback } from 'react';
import { classService } from '../services/classService';
import { notifications } from '@mantine/notifications';

export function useClasses(initialParams = {}) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: initialParams.limit || 9,
  });

  const [params, setParams] = useState({
    page: 1,
    limit: 9,
    search: '',
    status: null,
    ...initialParams
  });

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await classService.getClasses(params);
      const resData = res?.data || res;
      setClasses(resData?.items || []);
      if (resData?.pagination) {
        setPagination(resData.pagination);
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải danh sách lớp học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const setPage = (page) => {
    setParams(prev => ({ ...prev, page }));
  };

  const setSearch = (search) => {
    setParams(prev => ({ ...prev, search, page: 1 }));
  };

  const setStatus = (status) => {
    setParams(prev => ({ ...prev, status, page: 1 }));
  };

  const createClass = async (data) => {
    try {
      await classService.createClass(data);
      notifications.show({
        title: 'Thành công',
        message: 'Tạo lớp học mới thành công',
        color: 'green'
      });
      await fetchClasses();
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi tạo lớp học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    }
  };

  const updateClass = async (id, data) => {
    try {
      await classService.updateClass(id, data);
      notifications.show({
        title: 'Thành công',
        message: 'Cập nhật thông tin lớp học thành công',
        color: 'green'
      });
      await fetchClasses();
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi cập nhật',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    }
  };

  const deleteClass = async (id) => {
    try {
      await classService.deleteClass(id);
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa lớp học',
        color: 'green'
      });
      await fetchClasses();
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi xóa',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    }
  };

  return {
    classes,
    loading,
    pagination,
    params,
    setPage,
    setSearch,
    setStatus,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass
  };
}

export function useClassDetails(id) {
  const [classDetail, setClassDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await classService.getClassById(id);
      // Backend returns unified format { success: true, data: {...} }
      setClassDetail(res?.data || res);
    } catch (error) {
      notifications.show({
        title: 'Lỗi lấy thông tin',
        message: error.response?.data?.message || 'Không tìm thấy lớp học',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { classDetail, loading, refetch: fetchDetail };
}
