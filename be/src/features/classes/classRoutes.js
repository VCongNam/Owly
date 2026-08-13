import express from 'express';
import * as classController from './classController.js';
import * as studentController from '../students/studentController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createClassSchema, updateClassSchema } from './classSchema.js';
import { enrollExistingStudentSchema, createAndEnrollStudentSchema, bulkCreateAndEnrollStudentSchema } from '../students/studentSchema.js';
import {
  idParamsSchema,
  classIdParamsSchema,
  classAndStudentIdParamsSchema,
  classListQuerySchema,
  memberListQuerySchema,
} from '../../validation/commonSchema.js';

const router = express.Router();

// Tất cả các route của lớp học đều yêu cầu đăng nhập
router.use(authMiddleware);

// Tạo lớp học mới
router.post('/', validate(createClassSchema), classController.createClass);

// Lấy danh sách lớp học của giáo viên
router.get('/', validate(classListQuerySchema, 'query'), classController.getClasses);

// Lấy chi tiết một lớp học
router.get('/:id', validate(idParamsSchema, 'params'), classController.getClassById);

// Cập nhật thông tin lớp học
router.put('/:id',
  validate(idParamsSchema, 'params'),
  validate(updateClassSchema),
  classController.updateClass
);

// Xóa lớp học
router.delete('/:id', validate(idParamsSchema, 'params'), classController.deleteClass);

// ── QUẢN LÝ THÀNH VIÊN LỚP HỌC (MEMBERSHIP) ───────────────────

// Lấy danh sách thành viên của một lớp học
router.get('/:classId/members',
  validate(classIdParamsSchema, 'params'),
  validate(memberListQuerySchema, 'query'),
  studentController.getClassMembers
);

// Giáo viên ghi danh học viên có sẵn vào lớp
router.post('/:classId/members/enroll-existing',
  validate(classIdParamsSchema, 'params'),
  validate(enrollExistingStudentSchema),
  studentController.enrollExistingStudent
);

// Giáo viên tạo mới học viên và ghi danh thẳng vào lớp
router.post('/:classId/members/create-new',
  validate(classIdParamsSchema, 'params'),
  validate(createAndEnrollStudentSchema),
  studentController.createAndEnrollStudent
);

// Giáo viên tạo mới hàng loạt học viên và ghi danh vào lớp
router.post('/:classId/members/bulk-import',
  validate(classIdParamsSchema, 'params'),
  validate(bulkCreateAndEnrollStudentSchema),
  studentController.bulkImportStudents
);

// Giáo viên hủy ghi danh (unenroll) học viên khỏi lớp
router.delete('/:classId/members/:studentId',
  validate(classAndStudentIdParamsSchema, 'params'),
  studentController.unenrollStudent
);

// UC-35: Giáo viên xem nhật ký điểm danh tổng hợp của một học sinh trong lớp
router.get('/:classId/members/:studentId/attendance-log',
  validate(classAndStudentIdParamsSchema, 'params'),
  studentController.getStudentAttendanceLog
);

export default router;
