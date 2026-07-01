import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import * as profileController from './profileController.js';

const router = express.Router();

// Cấu hình Multer sử dụng memoryStorage (chỉ giữ file trong RAM, không ghi ra đĩa)
// để truyền buffer trực tiếp lên Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
});

router.use(authMiddleware);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

export default router;
