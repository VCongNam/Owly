import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as gradeCategoryController from './gradeCategoryController.js';
import { classIdParamsSchema, classAndCategoryIdParamsSchema } from '../../validation/commonSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/classes/:classId/grade-categories',
  validate(classIdParamsSchema, 'params'),
  gradeCategoryController.getGradeCategories
);
router.post('/classes/:classId/grade-categories',
  validate(classIdParamsSchema, 'params'),
  gradeCategoryController.createGradeCategory
);
router.put('/classes/:classId/grade-categories/:id',
  validate(classAndCategoryIdParamsSchema, 'params'),
  gradeCategoryController.updateGradeCategory
);
router.delete('/classes/:classId/grade-categories/:id',
  validate(classAndCategoryIdParamsSchema, 'params'),
  gradeCategoryController.deleteGradeCategory
);

export default router;
