import { useState, useCallback } from 'react';
import axiosInstance from '../services/axiosClient'; // Assuming this exists
import { notifications } from '@mantine/notifications';

export const useAssignment = (classId) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const fetchAssignments = useCallback(async (page = 1) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/assignments/class/${classId}?page=${page}&limit=10`);
      setAssignments(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách bài tập',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const createAssignment = async (data) => {
    try {
      await axiosInstance.post('/assignments', data);
      notifications.show({ title: 'Thành công', message: 'Đã tạo bài tập mới', color: 'green' });
      fetchAssignments(1);
      return true;
    } catch (error) {
      notifications.show({ title: 'Lỗi', message: error.response?.data?.message || 'Có lỗi xảy ra', color: 'red' });
      return false;
    }
  };

  const uploadEditorFile = async (htmlContent) => {
    try {
      const res = await axiosInstance.post('/assignments/create-file-from-editor', { htmlContent });
      return res.data.data.url;
    } catch (error) {
      notifications.show({ title: 'Lỗi', message: 'Không thể lưu nội dung soạn thảo thành file', color: 'red' });
      throw error;
    }
  };

  const uploadAttachments = async (files) => {
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await axiosInstance.post('/assignments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data.attachmentUrls;
    } catch (error) {
      notifications.show({ title: 'Lỗi', message: 'Không thể tải file lên', color: 'red' });
      throw error;
    }
  };

  return {
    assignments,
    loading,
    pagination,
    fetchAssignments,
    createAssignment,
    uploadEditorFile,
    uploadAttachments
  };
};
