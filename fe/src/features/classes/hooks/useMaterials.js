import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { materialService } from '../services/materials';

export function useMaterials(classId) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const fetchMaterials = useCallback(async (page = 1) => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await materialService.getClassMaterials(classId, { page, limit: 10 });
      setMaterials(response.items || []);
      setPagination(response.pagination || {
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        limit: 10
      });
    } catch (error) {
      console.error('Lỗi khi tải tài liệu:', error);
      // Lỗi hệ thống đã được handle và hiển thị toast trong apiClient.js
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const uploadMaterial = useCallback(async ({ files, title, description }) => {
    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    if (!classId || filesArray.length === 0) return false;
    setUploading(true);
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

      await materialService.uploadMaterial(classId, formData);
      
      notifications.show({
        title: 'Thành công',
        message: `Tải lên ${filesArray.length} tài liệu học tập thành công`,
        color: 'green'
      });
      
      // Refresh danh sách về trang 1
      await fetchMaterials(1);
      return true;
    } catch (error) {
      console.error('Lỗi khi tải lên tài liệu:', error);
      return false;
    } finally {
      setUploading(false);
    }
  }, [classId, fetchMaterials]);

  const deleteMaterial = useCallback(async (materialId) => {
    if (!materialId) return false;
    try {
      await materialService.deleteMaterial(materialId);
      
      notifications.show({
        title: 'Thành công',
        message: 'Xóa tài liệu học tập thành công',
        color: 'green'
      });

      // Cập nhật trực tiếp state local để tránh hiện loading overlay gây cảm giác load lại trang
      setMaterials((prev) => {
        const nextList = prev.filter((item) => item.id !== materialId);
        // Nếu trang hiện tại trống và không phải trang 1, tự động tải trang trước đó
        if (nextList.length === 0 && pagination.currentPage > 1) {
          fetchMaterials(pagination.currentPage - 1);
        }
        return nextList;
      });

      setPagination((prev) => {
        const nextTotal = Math.max(0, prev.totalItems - 1);
        const nextPages = Math.ceil(nextTotal / prev.limit) || 1;
        return {
          ...prev,
          totalItems: nextTotal,
          totalPages: nextPages,
          currentPage: prev.currentPage > nextPages ? nextPages : prev.currentPage
        };
      });

      return true;
    } catch (error) {
      console.error('Lỗi khi xóa tài liệu:', error);
      return false;
    }
  }, [fetchMaterials, pagination.currentPage, pagination.limit]);

  // Tự động fetch khi classId thay đổi
  useEffect(() => {
    fetchMaterials(1);
  }, [classId, fetchMaterials]);

  return {
    materials,
    loading,
    uploading,
    pagination,
    fetchMaterials,
    uploadMaterial,
    deleteMaterial
  };
}
