import { useState, useEffect, useCallback, useRef } from 'react';
import { classService } from '../services/classService';
import { notifications } from '@mantine/notifications';

const EMPTY_PAGINATION = {
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 9,
};

export function useClasses(initialParams = {}) {
  const [classes, setClasses] = useState([]);
  const [resolvedParamsKey, setResolvedParamsKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [params, setParams] = useState({
    page: 1,
    limit: 9,
    search: '',
    status: null,
    ...initialParams
  });

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentParamsKey = JSON.stringify(params);
  const loading = resolvedParamsKey !== currentParamsKey || refreshing;

  const fetchClasses = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const res = await classService.getClasses(params);
      const resData = res?.data || res;
      if (requestId === requestIdRef.current) {
        setClasses(resData?.items || []);
        if (resData?.pagination) {
          setPagination(resData.pagination);
        }
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        if (resolvedParamsKey !== currentParamsKey) {
          setClasses([]);
          setPagination(EMPTY_PAGINATION);
        }
        notifications.show({
          title: 'Lỗi tải danh sách lớp học',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedParamsKey(currentParamsKey);
      }
    }
  }, [params, currentParamsKey, resolvedParamsKey]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    const loadClasses = async () => {
      try {
        const requestParams = JSON.parse(currentParamsKey);
        const res = await classService.getClasses(requestParams);
        const resData = res?.data || res;
        if (requestId === requestIdRef.current) {
          setClasses(resData?.items || []);
          if (resData?.pagination) {
            setPagination(resData.pagination);
          }
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setClasses([]);
          setPagination(EMPTY_PAGINATION);
          notifications.show({
            title: 'Lỗi tải danh sách lớp học',
            message: error.response?.data?.message || 'Có lỗi xảy ra',
            color: 'red'
          });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setResolvedParamsKey(currentParamsKey);
        }
      }
    };

    loadClasses();

    return () => {
      requestIdRef.current += 1;
    };
  }, [currentParamsKey]);

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
      if (isMountedRef.current) {
        notifications.show({
          title: 'Thành công',
          message: 'Tạo lớp học mới thành công',
          color: 'green'
        });
        await fetchClasses();
      }
      return true;
    } catch (error) {
      if (isMountedRef.current) {
        notifications.show({
          title: 'Lỗi tạo lớp học',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
      return false;
    }
  };

  const updateClass = async (id, data) => {
    try {
      await classService.updateClass(id, data);
      if (isMountedRef.current) {
        notifications.show({
          title: 'Thành công',
          message: 'Cập nhật thông tin lớp học thành công',
          color: 'green'
        });
        await fetchClasses();
      }
      return true;
    } catch (error) {
      if (isMountedRef.current) {
        notifications.show({
          title: 'Lỗi cập nhật',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
      return false;
    }
  };

  const deleteClass = async (id) => {
    try {
      await classService.deleteClass(id);
      if (isMountedRef.current) {
        notifications.show({
          title: 'Thành công',
          message: 'Đã xóa lớp học',
          color: 'green'
        });
        await fetchClasses();
      }
      return true;
    } catch (error) {
      if (isMountedRef.current) {
        notifications.show({
          title: 'Lỗi xóa',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
      return false;
    }
  };

  const visibleClasses = resolvedParamsKey === currentParamsKey ? classes : [];
  const visiblePagination = resolvedParamsKey === currentParamsKey ? pagination : EMPTY_PAGINATION;

  return {
    classes: visibleClasses,
    loading,
    pagination: visiblePagination,
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
  const [resolvedId, setResolvedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const requestIdRef = useRef(0);

  const loading = Boolean(id) && (resolvedId !== id || refreshing);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const res = await classService.getClassById(id);
      if (requestId === requestIdRef.current) {
        setClassDetail(res?.data || res);
        setResolvedId(id);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        if (resolvedId !== id) {
          setClassDetail(null);
        }
        notifications.show({
          title: 'Lỗi lấy thông tin',
          message: error.response?.data?.message || 'Không tìm thấy lớp học',
          color: 'red'
        });
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedId(id);
      }
    }
  }, [id, resolvedId]);

  useEffect(() => {
    if (!id) return;
    const requestId = ++requestIdRef.current;

    const loadDetail = async () => {
      try {
        const res = await classService.getClassById(id);
        if (requestId === requestIdRef.current) {
          setClassDetail(res?.data || res);
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setClassDetail(null);
          notifications.show({
            title: 'Lỗi lấy thông tin',
            message: error.response?.data?.message || 'Không tìm thấy lớp học',
            color: 'red'
          });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setResolvedId(id);
        }
      }
    };

    loadDetail();

    return () => {
      requestIdRef.current += 1;
    };
  }, [id]);

  const visibleDetail = resolvedId === id ? classDetail : null;

  return { classDetail: visibleDetail, loading, refetch: fetchDetail };
}
