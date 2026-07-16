import express from 'express';
import * as scheduleController from './scheduleController.js';
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

export default router;
