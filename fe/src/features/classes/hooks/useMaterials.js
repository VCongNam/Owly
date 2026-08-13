import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { materialService } from '../services/materials';

const EMPTY_PAGINATION = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10
};

export function useMaterials(classId) {
  const [materials, setMaterials] = useState([]);
  const [resolvedClassId, setResolvedClassId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingClassId, setUploadingClassId] = useState(null);
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
  const uploading = Boolean(classId) && uploadingClassId === classId;

  const fetchMaterials = useCallback(async (page = 1) => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const response = await materialService.getClassMaterials(classId, { page, limit: 10 });
      if (requestId === requestIdRef.current) {
        setMaterials(response.items || []);
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
          setMaterials([]);
          setPagination(EMPTY_PAGINATION);
        }
        console.error('Lỗi khi tải tài liệu:', error);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedClassId(classId);
      }
    }
  }, [classId, resolvedClassId]);

  const uploadMaterial = useCallback(async ({ files, title, description }) => {
    const mutationClassId = classId;
    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    if (!mutationClassId || filesArray.length === 0) return false;
    setUploadingClassId(mutationClassId);
    try {
      const formData = new FormData();
      filesArray.forEach((file) => {
        formData.append('files', file);
      });
      if (title) {
        formData.append('title', title);
      }
      if (description) {
        formData.append('description', description);
      }

      await materialService.uploadMaterial(mutationClassId, formData);

      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        notifications.show({
          title: 'Thành công',
          message: `Tải lên ${filesArray.length} tài liệu học tập thành công`,
          color: 'green'
        });
        await fetchMaterials(1);
      }
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi tải lên tài liệu:', error);
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setUploadingClassId(current =>
          current === mutationClassId ? null : current
        );
      }
    }
  }, [classId, fetchMaterials]);

  const deleteMaterial = useCallback(async (materialId) => {
    if (!materialId) return false;
    const mutationClassId = currentClassIdRef.current;
    try {
      await materialService.deleteMaterial(materialId);

      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        notifications.show({
          title: 'Thành công',
          message: 'Xóa tài liệu học tập thành công',
          color: 'green'
        });

        const currentPage = pagination.currentPage;
        const targetPage = materials.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

        await fetchMaterials(targetPage);
      }

      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi xóa tài liệu:', error);
      }
      return false;
    }
  }, [fetchMaterials, pagination.currentPage, materials.length]);

  // Tự động fetch khi classId thay đổi
  useEffect(() => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;

    const loadInitialMaterials = async () => {
      try {
        const response = await materialService.getClassMaterials(classId, { page: 1, limit: 10 });
        if (requestId === requestIdRef.current) {
          setMaterials(response.items || []);
          setPagination(response.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10
          });
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setMaterials([]);
          setPagination(EMPTY_PAGINATION);
          console.error('Lỗi khi tải tài liệu:', error);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setResolvedClassId(classId);
        }
      }
    };

    loadInitialMaterials();

    return () => {
      requestIdRef.current += 1;
    };
  }, [classId]);

  const visibleMaterials = resolvedClassId === classId ? materials : [];
  const visiblePagination = resolvedClassId === classId ? pagination : EMPTY_PAGINATION;

  return {
    materials: visibleMaterials,
    loading,
    uploading,
    pagination: visiblePagination,
    fetchMaterials,
    uploadMaterial,
    deleteMaterial
  };
}
