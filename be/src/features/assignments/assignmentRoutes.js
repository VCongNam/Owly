import express from 'express';
import multer from 'multer';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';
import * as assignmentController from './assignmentController.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  createSubmissionSchema,
  gradeSubmissionSchema,
} from './assignmentSchema.js';
import { paginationSchema } from '../../validation/paginationSchema.js';
import {
  upcomingLimitSchema,
  idParamsSchema,
  classIdParamsSchema,
  assignmentIdParamsSchema,
  submissionIdParamsSchema,
} from '../../validation/commonSchema.js';

const router = express.Router();

// Memory storage for multer (will upload buffer to R2)
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/teacher/upcoming', validate(upcomingLimitSchema, 'query'), assignmentController.getTeacherUpcomingAssignments);
router.post('/', validate(createAssignmentSchema), assignmentController.createAssignment);
router.get('/class/:classId',
  validate(classIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  assignmentController.getAssignments
);
router.put('/:id',
  validate(idParamsSchema, 'params'),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment
);
router.delete('/:id',
  validate(idParamsSchema, 'params'),
  assignmentController.deleteAssignment
);

// Submissions & Grading routes
router.post('/:assignmentId/submissions',
  validate(assignmentIdParamsSchema, 'params'),
  validate(createSubmissionSchema),
  assignmentController.submitAssignment
);
router.get('/:assignmentId/my-submission',
  validate(assignmentIdParamsSchema, 'params'),
  assignmentController.getMySubmission
);
router.get('/:assignmentId/submissions',
  validate(assignmentIdParamsSchema, 'params'),
  assignmentController.getAssignmentSubmissions
);
router.post('/submissions/:submissionId/feedback',
  validate(submissionIdParamsSchema, 'params'),
  validate(gradeSubmissionSchema),
  assignmentController.gradeSubmission
);

// Upload routes
router.post('/create-file-from-editor', assignmentController.createFileFromEditor);

export default router;
