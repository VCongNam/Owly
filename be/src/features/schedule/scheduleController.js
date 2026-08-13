import * as scheduleService from './scheduleService.js';
import { getSessionsQuerySchema } from './scheduleSchema.js';
import { AppError } from '../../utils/appError.js';

export const getPersonalSchedule = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    // Validate queries
    const parsedQuery = getSessionsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      const appErr = new AppError('Các tham số lọc ngày không hợp lệ', 400);
      appErr.errors = parsedQuery.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(appErr);
    }

    const { startDate, endDate } = parsedQuery.data;
    const sessions = await scheduleService.getPersonalSchedule(teacherId, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
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
    next(error);
  }
};

export const setupRecurringSchedule = async (req, res, next) => {
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
    next(error);
  }
};

export const createManualSession = async (req, res, next) => {
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
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
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
    next(error);
  }
};
