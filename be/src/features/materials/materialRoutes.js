import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as materialController from './materialController.js';
import { classIdParamsSchema, idParamsSchema } from '../../validation/commonSchema.js';
import { paginationSchema } from '../../validation/paginationSchema.js';

const router = express.Router();

// Cấu hình Multer với Memory Storage để chuyển trực tiếp sang R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // Giới hạn 15MB cho tài liệu học tập
  }
});

// Tất cả các endpoints đều yêu cầu đăng nhập
router.use(authMiddleware);

// Tải lên tài liệu học tập mới (Hỗ trợ tải lên nhiều file cùng lúc)
router.post('/classes/:classId/materials',
  validate(classIdParamsSchema, 'params'),
  upload.array('files', 10),
  materialController.uploadMaterial
);

// Lấy danh sách tài liệu học tập của lớp học (có phân trang)
router.get('/classes/:classId/materials',
  validate(classIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  materialController.getClassMaterials
);

// Xóa tài liệu học tập
router.delete('/materials/:id',
  validate(idParamsSchema, 'params'),
  materialController.deleteMaterial
);

export default router;
