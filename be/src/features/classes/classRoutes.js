import express from 'express';
import * as classController from './classController.js';
import * as studentController from '../students/studentController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createClassSchema, updateClassSchema } from './classSchema.js';
import { enrollExistingStudentSchema, createAndEnrollStudentSchema } from '../students/studentSchema.js';

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

// ── QUẢN LÝ THÀNH VIÊN LỚP HỌC (MEMBERSHIP) ───────────────────

// Lấy danh sách thành viên của một lớp học
router.get('/:classId/members', studentController.getClassMembers);

// Giáo viên ghi danh học viên có sẵn vào lớp
router.post('/:classId/members/enroll-existing', validate(enrollExistingStudentSchema), studentController.enrollExistingStudent);

// Giáo viên tạo mới học viên và ghi danh thẳng vào lớp
router.post('/:classId/members/create-new', validate(createAndEnrollStudentSchema), studentController.createAndEnrollStudent);

// Giáo viên hủy ghi danh (unenroll) học viên khỏi lớp
router.delete('/:classId/members/:studentId', studentController.unenrollStudent);

export default router;
