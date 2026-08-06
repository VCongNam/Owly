import * as tuitionService from './tuitionService.js';
import {
  upsertClassTumSchema,
  generateInvoicesSchema,
  submitProofSchema,
  reviewTransactionSchema,
} from './tuitionValidation.js';

export const getClassTuitionConfig = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const config = await tuitionService.getClassTuitionConfig(classId);
    return res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const updateClassTuitionConfig = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const validatedData = upsertClassTumSchema.parse(req.body);
    const config = await tuitionService.upsertClassTuitionConfig(classId, validatedData);
    return res.json({
      success: true,
      message: 'Cập nhật đơn giá học phí thành công',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

export const generateMonthlyInvoices = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const validatedData = generateInvoicesSchema.parse(req.body);
    const result = await tuitionService.generateMonthlyInvoices(classId, teacherId, validatedData);
    return res.status(201).json({
      success: true,
      message: `Đã phát hành thành công ${result.totalInvoicesGenerated} hóa đơn học phí cho tháng ${result.billingMonth}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getClassInvoices = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const { billingMonth, status, search } = req.query;

    const result = await tuitionService.getClassInvoices(classId, {
      page,
      limit,
      billingMonth,
      status,
      search,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentInvoices = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const invoices = await tuitionService.getStudentInvoices(studentId);
    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPaymentProof = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { invoiceId } = req.params;
    const validatedData = submitProofSchema.parse(req.body);
    const transaction = await tuitionService.submitPaymentProof(studentId, invoiceId, validatedData);
    return res.json({
      success: true,
      message: 'Tải minh chứng thanh toán thành công, vui lòng chờ giáo viên đối soát',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewTransaction = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { transactionId } = req.params;
    const validatedData = reviewTransactionSchema.parse(req.body);
    const updatedTransaction = await tuitionService.reviewTransaction(teacherId, transactionId, validatedData);
    const actionLabel = validatedData.status === 'Approved' ? 'Duyệt' : 'Từ chối';
    return res.json({
      success: true,
      message: `${actionLabel} giao dịch học phí thành công`,
      data: updatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherPendingInvoices = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const invoices = await tuitionService.getTeacherPendingInvoices(teacherId);
    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

