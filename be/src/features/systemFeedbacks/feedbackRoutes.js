import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createFeedbackSchema } from './feedbackSchema.js';
import * as feedbackController from './feedbackController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createFeedbackSchema), feedbackController.createFeedback);
router.get('/my', feedbackController.getMyFeedbacks);

export default router;
