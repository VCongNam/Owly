import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { assignmentService } from '../services/assignments';
import { uploadService } from '../../../services/uploadService';

const EMPTY_PAGINATION = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10
};

export function useAssignments(classId) {
  const [assignments, setAssignments] = useState([]);
  const [resolvedClassId, setResolvedClassId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingClassId, setSubmittingClassId] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentClassIdRef = useRef(classId);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentClassIdRef.current = classId;
  }, [classId]);

  const loading = Boolean(classId) && (resolvedClassId !== classId || refreshing);
  const submitting = Boolean(classId) && submittingClassId === classId;

  const fetchAssignments = useCallback(async (page = 1) => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const response = await assignmentService.getAssignments(classId, { page, limit: 10 });
      if (requestId === requestIdRef.current) {
        setAssignments(response.items || []);
        setPagination(response.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          limit: 10
        });
        setResolvedClassId(classId);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        if (resolvedClassId !== classId) {
          setAssignments([]);
          setPagination(EMPTY_PAGINATION);
        }
        console.error('Lỗi khi tải danh sách bài tập:', error);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedClassId(classId);
      }
    }
  }, [classId, resolvedClassId]);

  const createAssignment = useCallback(async ({ title, gradeCategoryId, dueDate, maxPoints, mode, htmlContent, files }) => {
    const mutationClassId = classId;
    if (!mutationClassId) return false;
    setSubmittingClassId(mutationClassId);
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
        classId: mutationClassId,
        gradeCategoryId,
        title,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints: Number(maxPoints),
        attachmentUrls
      });

      if (!isMountedRef.current || currentClassIdRef.current !== mutationClassId) {
        return true;
      }

      notifications.show({
        title: 'Thành công',
        message: 'Đã tạo bài tập mới',
        color: 'green'
      });
      await fetchAssignments(1);
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi tạo bài tập:', error);
        notifications.show({
          title: 'Thất bại',
          message: error?.response?.data?.message || 'Không thể tạo bài tập. Vui lòng thử lại.',
          color: 'red'
        });
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setSubmittingClassId(current =>
          current === mutationClassId ? null : current
        );
      }
    }
  }, [classId, fetchAssignments]);

  const deleteAssignment = useCallback(async (id) => {
    const mutationClassId = currentClassIdRef.current;
    try {
      await assignmentService.deleteAssignment(id);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
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
      }
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi xóa bài tập:', error);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;

    const loadInitialAssignments = async () => {
      try {
        const response = await assignmentService.getAssignments(classId, { page: 1, limit: 10 });
        if (requestId === requestIdRef.current) {
          setAssignments(response.items || []);
          setPagination(response.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10
          });
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setAssignments([]);
          setPagination(EMPTY_PAGINATION);
          console.error('Lỗi khi tải danh sách bài tập:', error);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setResolvedClassId(classId);
        }
      }
    };

    loadInitialAssignments();

    return () => {
      requestIdRef.current += 1;
    };
  }, [classId]);

  const visibleAssignments = resolvedClassId === classId ? assignments : [];
  const visiblePagination = resolvedClassId === classId ? pagination : EMPTY_PAGINATION;

  return {
    assignments: visibleAssignments,
    loading,
    submitting,
    pagination: visiblePagination,
    fetchAssignments,
    createAssignment,
    deleteAssignment
  };
}
