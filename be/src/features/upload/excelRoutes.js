import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import * as excelController from './excelController.js';

const router = express.Router();

// Tất cả các route tiện ích Excel đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/template-students', excelController.getStudentTemplate);

export default router;
