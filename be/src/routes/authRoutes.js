// be/src/routes/authRoutes.js
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { signUpSchema, signInSchema } from '../validation/authSchema.js';

const router = express.Router();

// Route đăng ký tài khoản mới (Công khai, đã gắn validate bằng Tiếng Việt)
router.post('/signup', validate(signUpSchema), authController.signUp);

// Route đăng nhập lấy token (Công khai, đã gắn validate bằng Tiếng Việt)
router.post('/signin', validate(signInSchema), authController.signIn);

// Route đồng bộ hồ sơ Giáo viên (Cần gửi kèm Token để xác thực danh tính)
router.post('/register-profile', authMiddleware, authController.registerTeacherProfile);

// Route lấy thông tin cá nhân của Giáo viên đang đăng nhập
router.get('/me', authMiddleware, authController.getProfile);

export default router;