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

const router = express.Router();

// Memory storage for multer (will upload buffer to R2)
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/teacher/upcoming', assignmentController.getTeacherUpcomingAssignments);
router.post('/', validate(createAssignmentSchema), assignmentController.createAssignment);
router.get('/class/:classId', assignmentController.getAssignments);
router.put('/:id', validate(updateAssignmentSchema), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

// Submissions & Grading routes
router.post('/:assignmentId/submissions', validate(createSubmissionSchema), assignmentController.submitAssignment);
router.get('/:assignmentId/my-submission', assignmentController.getMySubmission);
router.get('/:assignmentId/submissions', assignmentController.getAssignmentSubmissions);
router.post('/submissions/:submissionId/feedback', validate(gradeSubmissionSchema), assignmentController.gradeSubmission);

// Upload routes
router.post('/create-file-from-editor', assignmentController.createFileFromEditor);

export default router;
