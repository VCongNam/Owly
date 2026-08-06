import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import * as tuitionController from './tuitionController.js';

const router = express.Router();

router.use(authMiddleware);

// Cấu hình đơn giá học phí cho lớp
router.get('/classes/:classId/tuition-config', tuitionController.getClassTuitionConfig);
router.put('/classes/:classId/tuition-config', tuitionController.updateClassTuitionConfig);

// Phát hành & lấy danh sách hóa đơn theo lớp (Dành cho Giáo viên)
router.post('/classes/:classId/invoices/generate', tuitionController.generateMonthlyInvoices);
router.get('/classes/:classId/invoices', tuitionController.getClassInvoices);

// Xem hóa đơn cá nhân & nộp minh chứng (Dành cho Học sinh / Phụ huynh)
router.get('/tuition/teacher/pending', tuitionController.getTeacherPendingInvoices);
router.get('/tuition/my-invoices', tuitionController.getStudentInvoices);
router.post('/tuition/invoices/:invoiceId/submit-proof', tuitionController.submitPaymentProof);

// Giáo viên đối soát & duyệt / từ chối giao dịch
router.patch('/tuition/transactions/:transactionId/review', tuitionController.reviewTransaction);

export default router;
