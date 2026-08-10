import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { assignmentService } from '../services/assignments';
import { uploadService } from '../../../services/uploadService';

export function useAssignments(classId) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const fetchAssignments = useCallback(async (page = 1) => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments(classId, { page, limit: 10 });
      setAssignments(response.items || []);
      setPagination(response.pagination || {
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        limit: 10
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách bài tập:', error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const createAssignment = useCallback(async ({ title, gradeCategoryId, dueDate, maxPoints, mode, htmlContent, files }) => {
    if (!classId) return false;
    setSubmitting(true);
    try {
      let attachmentUrls = [];

      if (mode === 'editor' && htmlContent) {
        const result = await assignmentService.createFileFromEditor(htmlContent);
        if (result?.url) attachmentUrls.push(result.url);
      } else if (mode === 'upload' && files?.length > 0) {
        const result = await uploadService.uploadFiles(files, 'assignments');
        attachmentUrls = result?.attachmentUrls || [];
      }

      await assignmentService.createAssignment({
        classId,
        gradeCategoryId,
        title,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints: Number(maxPoints),
        attachmentUrls
      });

      notifications.show({
        title: 'Thành công',
        message: 'Đã tạo bài tập mới',
        color: 'green'
      });
      await fetchAssignments(1);
      return true;
    } catch (error) {
      console.error('Lỗi khi tạo bài tập:', error);
      notifications.show({
        title: 'Thất bại',
        message: error?.response?.data?.message || 'Không thể tạo bài tập. Vui lòng thử lại.',
        color: 'red'
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [classId, fetchAssignments]);

  const deleteAssignment = useCallback(async (id) => {
    try {
      await assignmentService.deleteAssignment(id);
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa bài tập',
        color: 'green'
      });
      setAssignments(prev => prev.filter(a => a.id !== id));
      setPagination(prev => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1)
      }));
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa bài tập:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAssignments(1);
  }, [classId, fetchAssignments]);

  return {
    assignments,
    loading,
    submitting,
    pagination,
    fetchAssignments,
    createAssignment,
    deleteAssignment
  };
}
