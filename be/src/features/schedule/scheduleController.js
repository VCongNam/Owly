import * as scheduleService from './scheduleService.js';
import { getSessionsQuerySchema } from './scheduleSchema.js';

export const getPersonalSchedule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    // Validate queries
    const parsedQuery = getSessionsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        success: false,
        message: 'Các tham số lọc ngày không hợp lệ',
        errors: parsedQuery.error.errors.map(err => err.message)
      });
    }

    const { startDate, endDate } = parsedQuery.data;
    const sessions = await scheduleService.getPersonalSchedule(teacherId, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lấy lịch dạy thất bại'
    });
  }
};

export const getClassSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { classId } = req.params;
    const { page, limit } = req.query;

    const result = await scheduleService.getClassSessions(classId, userId, userRole, { page, limit });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lấy danh sách buổi học của lớp thất bại'
    });
  }
};

export const setupRecurringSchedule = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;
    const { schedules, generationRange } = req.body;

    const result = await scheduleService.setupRecurringSchedule(classId, teacherId, schedules, generationRange);

    return res.status(200).json({
      success: true,
      message: `Đã cấu hình lịch học cố định và tự động sinh ${result.createdSessionsCount} buổi học thành công.`,
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Cấu hình lịch học thất bại'
    });
  }
};

export const createManualSession = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;
    const data = req.body;

    const newSession = await scheduleService.createManualSession(classId, teacherId, data);

    return res.status(201).json({
      success: true,
      message: 'Tạo buổi học thành công',
      data: newSession
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Tạo buổi học thất bại'
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { sessionId } = req.params;
    const data = req.body;

    const updatedSession = await scheduleService.updateSession(sessionId, teacherId, data);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật buổi học thành công',
      data: updatedSession
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Cập nhật buổi học thất bại'
    });
  }
};
