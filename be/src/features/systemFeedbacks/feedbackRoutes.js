import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createFeedbackSchema } from './feedbackSchema.js';
import * as feedbackController from './feedbackController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.use(authMiddleware);

router.post('/upload-image', upload.array('images', 5), feedbackController.uploadImage);
router.post('/', validate(createFeedbackSchema), feedbackController.createFeedback);
router.get('/my', feedbackController.getMyFeedbacks);

export default router;
