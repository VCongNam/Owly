import * as tuitionService from './tuitionService.js';

export const getClassTuitionConfig = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const config = await tuitionService.getClassTuitionConfig(classId, req.user.id, req.user.role);
    return res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const updateClassTuitionConfig = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const validatedData = req.body;
    const config = await tuitionService.upsertClassTuitionConfig(classId, req.user.id, validatedData);
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
    const validatedData = req.body;
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
    const { page, limit, billingMonth, status, search } = req.query;

    const result = await tuitionService.getClassInvoices(classId, req.user.id, req.user.role, {
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
    const validatedData = req.body;
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
    const validatedData = req.body;
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
