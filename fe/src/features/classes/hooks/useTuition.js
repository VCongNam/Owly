import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { tuitionService } from '../services/tuition';

export function useClassTuition(classId) {
  const [config, setConfig] = useState({ amount: 0, billingCycle: 'Monthly' });
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [stats, setStats] = useState({ totalExpected: 0, totalCollected: 0, totalPending: 0, totalUnpaid: 0 });
  const [unbilledPastMonths, setUnbilledPastMonths] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Cấu hình học phí
  const fetchConfig = useCallback(async () => {
    if (!classId) return;
    setLoadingConfig(true);
    try {
      const res = await tuitionService.getClassTuitionConfig(classId);
      setConfig(res || { amount: 0, billingCycle: 'Monthly' });
    } catch (error) {
      console.error('Lỗi khi tải cấu hình học phí:', error);
    } finally {
      setLoadingConfig(false);
    }
  }, [classId]);

  // Cập nhật Cấu hình đơn giá
  const updateConfig = useCallback(async (amount, billingCycle = 'Monthly') => {
    if (!classId) return false;
    setSubmitting(true);
    try {
      const res = await tuitionService.updateClassTuitionConfig(classId, { amount: Number(amount), billingCycle });
      setConfig(res || { amount: Number(amount), billingCycle });
      notifications.show({
        title: 'Thành công',
        message: 'Đã cập nhật đơn giá học phí thành công',
        color: 'green',
      });
      return true;
    } catch (error) {
      console.error('Lỗi khi cập nhật cấu hình học phí:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [classId]);

  // Fetch Danh sách Hóa đơn
  const fetchInvoices = useCallback(async (filters = {}) => {
    if (!classId) return;
    setLoadingInvoices(true);
    try {
      const res = await tuitionService.getClassInvoices(classId, {
        page: filters.page || 1,
        limit: filters.limit || 10,
        billingMonth: filters.billingMonth,
        status: filters.status,
        search: filters.search,
      });
      setInvoices(res.items || []);
      setPagination(res.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
      setStats(res.stats || { totalExpected: 0, totalCollected: 0, totalPending: 0, totalUnpaid: 0 });
      setUnbilledPastMonths(res.unbilledPastMonths || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hóa đơn:', error);
    } finally {
      setLoadingInvoices(false);
    }
  }, [classId]);

  // Sinh Hóa đơn Tháng
  const generateInvoices = useCallback(async ({ billingMonth, dueDate, amountPerSession }) => {
    if (!classId) return false;
    setSubmitting(true);
    try {
      const res = await tuitionService.generateMonthlyInvoices(classId, {
        billingMonth,
        dueDate: new Date(dueDate).toISOString(),
        amountPerSession: amountPerSession !== undefined ? Number(amountPerSession) : undefined,
      });
      notifications.show({
        title: 'Phát hành thành công',
        message: `Đã phát hành ${res?.totalInvoicesGenerated || 0} hóa đơn học phí cho tháng ${billingMonth}`,
        color: 'green',
      });
      await fetchInvoices({ billingMonth });
      return true;
    } catch (error) {
      console.error('Lỗi khi phát hành hóa đơn:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [classId, fetchInvoices]);

  // Duyệt / Từ chối giao dịch
  const reviewTransaction = useCallback(async (transactionId, status, rejectionReason = '') => {
    setSubmitting(true);
    try {
      await tuitionService.reviewTransaction(transactionId, { status, rejectionReason });
      notifications.show({
        title: status === 'Approved' ? 'Đã duyệt thanh toán' : 'Đã từ chối giao dịch',
        message: status === 'Approved' ? 'Hóa đơn đã chuyển sang trạng thái Đã thanh toán' : 'Hóa đơn được đặt lại thành Chưa thanh toán',
        color: status === 'Approved' ? 'green' : 'orange',
      });
      return true;
    } catch (error) {
      console.error('Lỗi khi xét duyệt giao dịch:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [classId, fetchConfig]);

  return {
    config,
    loadingConfig,
    invoices,
    loadingInvoices,
    stats,
    unbilledPastMonths,
    pagination,
    submitting,
    fetchConfig,
    updateConfig,
    fetchInvoices,
    generateInvoices,
    reviewTransaction,
  };
}
