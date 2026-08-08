import { attendanceService } from './attendanceService.js';
import { upsertAttendanceSchema } from './attendanceSchema.js';

export const attendanceController = {
  getAttendancesBySession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const teacherId = req.user.id;

      const attendances = await attendanceService.getAttendancesBySession(sessionId, teacherId);

      res.status(200).json({
        status: 'success',
        data: attendances
      });
    } catch (error) {
      next(error);
    }
  },

  upsertAttendances: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const teacherId = req.user.id;

      // Validate body
      const validatedData = upsertAttendanceSchema.parse(req.body);

      const result = await attendanceService.upsertAttendances(
        sessionId,
        teacherId,
        validatedData.attendances
      );

      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};
