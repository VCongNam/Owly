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

const router = express.Router();

// Yêu cầu đăng nhập đối với tất cả các route lịch học
router.use(authMiddleware);

// Lấy lịch dạy cá nhân của giáo viên (query: startDate, endDate)
router.get('/schedule', scheduleController.getPersonalSchedule);

// Lấy danh sách buổi học của một lớp cụ thể
router.get('/classes/:classId/sessions', scheduleController.getClassSessions);

// Thiết lập/cập nhật lịch tuần lặp lại & sinh tự động các buổi học
router.post('/classes/:classId/schedules', validate(setupRecurringScheduleSchema), scheduleController.setupRecurringSchedule);

// Tạo buổi lẻ / buổi học bù thủ công
router.post('/classes/:classId/sessions', validate(createSessionSchema), scheduleController.createManualSession);

// Chỉnh sửa hoặc hủy buổi học cụ thể
router.put('/classes/:classId/sessions/:sessionId', validate(updateSessionSchema), scheduleController.updateSession);

// UC-35B/C: Nhận xét buổi học (lấy danh sách và cập nhật)
router.get('/sessions/:sessionId/feedbacks', feedbackController.getSessionFeedbacks);
router.put('/sessions/:sessionId/feedbacks', feedbackController.upsertSessionFeedbacks);

export default router;

