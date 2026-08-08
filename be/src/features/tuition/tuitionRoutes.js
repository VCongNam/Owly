import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as tuitionController from './tuitionController.js';
import {
  classIdParamsSchema,
  invoiceIdParamsSchema,
  transactionIdParamsSchema,
  invoiceListQuerySchema,
} from '../../validation/commonSchema.js';
import {
  upsertClassTumSchema,
  generateInvoicesSchema,
  submitProofSchema,
  reviewTransactionSchema,
} from './tuitionValidation.js';

const router = express.Router();

router.use(authMiddleware);

// Cấu hình đơn giá học phí cho lớp
router.get('/classes/:classId/tuition-config',
  validate(classIdParamsSchema, 'params'),
  tuitionController.getClassTuitionConfig
);
router.put('/classes/:classId/tuition-config',
  validate(classIdParamsSchema, 'params'),
  validate(upsertClassTumSchema),
  tuitionController.updateClassTuitionConfig
);

// Phát hành & lấy danh sách hóa đơn theo lớp (Dành cho Giáo viên)
router.post('/classes/:classId/invoices/generate',
  validate(classIdParamsSchema, 'params'),
  validate(generateInvoicesSchema),
  tuitionController.generateMonthlyInvoices
);
router.get('/classes/:classId/invoices',
  validate(classIdParamsSchema, 'params'),
  validate(invoiceListQuerySchema, 'query'),
  tuitionController.getClassInvoices
);

// Xem hóa đơn cá nhân & nộp minh chứng (Dành cho Học sinh / Phụ huynh)
router.get('/tuition/teacher/pending', tuitionController.getTeacherPendingInvoices);
router.get('/tuition/my-invoices', tuitionController.getStudentInvoices);
router.post('/tuition/invoices/:invoiceId/submit-proof',
  validate(invoiceIdParamsSchema, 'params'),
  validate(submitProofSchema),
  tuitionController.submitPaymentProof
);

// Giáo viên đối soát & duyệt / từ chối giao dịch
router.patch('/tuition/transactions/:transactionId/review',
  validate(transactionIdParamsSchema, 'params'),
  validate(reviewTransactionSchema),
  tuitionController.reviewTransaction
);

export default router;
