import express from 'express';
import multer from 'multer';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';
import * as assignmentController from './assignmentController.js';
import { createAssignmentSchema, updateAssignmentSchema } from './assignmentSchema.js';

const router = express.Router();

// Memory storage for multer (will upload buffer to R2)
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', validate(createAssignmentSchema), assignmentController.createAssignment);
router.get('/class/:classId', assignmentController.getAssignments);
router.put('/:id', validate(updateAssignmentSchema), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

// Upload routes
router.post('/upload', upload.array('files', 10), assignmentController.uploadFiles);
router.post('/create-file-from-editor', assignmentController.createFileFromEditor);

export default router;
