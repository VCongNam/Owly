import express from 'express';
import * as classController from './classController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createClassSchema, updateClassSchema } from './classSchema.js';

const router = express.Router();

// Tất cả các route của lớp học đều yêu cầu đăng nhập
router.use(authMiddleware);

// Tạo lớp học mới
router.post('/', validate(createClassSchema), classController.createClass);

// Lấy danh sách lớp học của giáo viên
router.get('/', classController.getClasses);

// Lấy chi tiết một lớp học
router.get('/:id', classController.getClassById);

// Cập nhật thông tin lớp học
router.put('/:id', validate(updateClassSchema), classController.updateClass);

// Xóa lớp học
router.delete('/:id', classController.deleteClass);

export default router;
