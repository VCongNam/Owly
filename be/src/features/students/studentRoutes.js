import express from 'express';
import * as studentController from './studentController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { studentUpdateProfileSchema } from './studentSchema.js';
import {
  idParamsSchema,
  studentListQuerySchema,
  studentScheduleQuerySchema,
} from '../../validation/commonSchema.js';

const router = express.Router();

// Tất cả các route của học viên đều yêu cầu đăng nhập
router.use(authMiddleware);

// Góc nhìn giáo viên
router.get('/', validate(studentListQuerySchema, 'query'), studentController.getStudents);
router.get('/search-directory', studentController.searchDirectory);

// Góc nhìn học sinh
router.get('/me/classes', studentController.getMyClasses);
router.get('/me/schedule', validate(studentScheduleQuerySchema, 'query'), studentController.getMySchedule);

// Học sinh tự cập nhật thông tin cá nhân của mình
router.put('/profile/self', validate(studentUpdateProfileSchema), studentController.updateSelfProfile);

// Lấy chi tiết thông tin một học sinh
router.get('/:id', validate(idParamsSchema, 'params'), studentController.getStudentById);

export default router;
