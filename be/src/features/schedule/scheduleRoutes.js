import express from 'express';
import * as scheduleController from './scheduleController.js';
import * as feedbackController from './feedbackController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  setupRecurringScheduleSchema,
  createSessionSchema,
  updateSessionSchema
} from './scheduleSchema.js';
import {
  classIdParamsSchema,
  sessionIdParamsSchema,
  classAndSessionIdParamsSchema,
} from '../../validation/commonSchema.js';
import { paginationSchema } from '../../validation/paginationSchema.js';

const router = express.Router();

// Yêu cầu đăng nhập đối với tất cả các route lịch học
router.use(authMiddleware);

// Lấy lịch dạy cá nhân của giáo viên (query: startDate, endDate)
router.get('/schedule', scheduleController.getPersonalSchedule);

// Lấy danh sách buổi học của một lớp cụ thể
router.get('/classes/:classId/sessions',
  validate(classIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  scheduleController.getClassSessions
);

// Thiết lập/cập nhật lịch tuần lặp lại & sinh tự động các buổi học
router.post('/classes/:classId/schedules',
  validate(classIdParamsSchema, 'params'),
  validate(setupRecurringScheduleSchema),
  scheduleController.setupRecurringSchedule
);

// Tạo buổi lẻ / buổi học bù thủ công
router.post('/classes/:classId/sessions',
  validate(classIdParamsSchema, 'params'),
  validate(createSessionSchema),
  scheduleController.createManualSession
);

// Chỉnh sửa hoặc hủy buổi học cụ thể
router.put('/classes/:classId/sessions/:sessionId',
  validate(classAndSessionIdParamsSchema, 'params'),
  validate(updateSessionSchema),
  scheduleController.updateSession
);

// UC-35B/C: Nhận xét buổi học (lấy danh sách và cập nhật)
router.get('/sessions/:sessionId/feedbacks',
  validate(sessionIdParamsSchema, 'params'),
  feedbackController.getSessionFeedbacks
);
router.put('/sessions/:sessionId/feedbacks',
  validate(sessionIdParamsSchema, 'params'),
  feedbackController.upsertSessionFeedbacks
);

export default router;
