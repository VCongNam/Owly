import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import * as uploadController from './uploadController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Áp dụng middleware xác thực
router.use(authMiddleware);

// Endpoint tải lên tập tin
router.post('/', upload.array('files', 10), uploadController.uploadFiles);

export default router;
