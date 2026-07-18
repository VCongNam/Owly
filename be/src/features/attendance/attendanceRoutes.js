import express from 'express';
import { attendanceController } from './attendanceController.js';
import { authMiddleware as authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// Route: /api/sessions/:sessionId/attendances
router.use(authenticate);

router.get('/', attendanceController.getAttendancesBySession);
router.put('/', attendanceController.upsertAttendances);

export default router;
