import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import * as gradeCategoryController from './gradeCategoryController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/classes/:classId/grade-categories', gradeCategoryController.getGradeCategories);
router.post('/classes/:classId/grade-categories', gradeCategoryController.createGradeCategory);

export default router;
