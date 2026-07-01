import { useState, useEffect, useCallback } from 'react';
import { classService } from '../services/classService';
import { notifications } from '@mantine/notifications';

export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await classService.getClasses();
      console.log('fetchClasses res:', res);
      setClasses(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải danh sách lớp học',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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
      setClassDetail(res);
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
