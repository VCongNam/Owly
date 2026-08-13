import express from 'express';
import { attendanceController } from './attendanceController.js';
import { authMiddleware as authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { sessionIdParamsSchema } from '../../validation/commonSchema.js';

const router = express.Router({ mergeParams: true });

// Route: /api/sessions/:sessionId/attendances
router.use(authenticate);

router.get('/', validate(sessionIdParamsSchema, 'params'), attendanceController.getAttendancesBySession);
router.put('/', validate(sessionIdParamsSchema, 'params'), attendanceController.upsertAttendances);

export default router;
