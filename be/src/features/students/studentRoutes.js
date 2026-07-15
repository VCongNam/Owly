import express from 'express';
import * as studentController from './studentController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { studentUpdateProfileSchema } from './studentSchema.js';

const router = express.Router();

// Tất cả các route của học viên đều yêu cầu đăng nhập
router.use(authMiddleware);

// Lấy danh sách học viên của các lớp do giáo viên phụ trách
router.get('/', studentController.getStudents);

// Tìm kiếm học viên trên toàn hệ thống để thêm vào lớp
router.get('/search-directory', studentController.searchDirectory);

// Học sinh tự cập nhật thông tin cá nhân của mình
router.put('/profile/self', validate(studentUpdateProfileSchema), studentController.updateSelfProfile);

// Lấy chi tiết thông tin một học sinh
router.get('/:id', studentController.getStudentById);

export default router;
