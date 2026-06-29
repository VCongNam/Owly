import express from 'express';
import * as authController from './authController.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { signUpSchema, signInSchema, changePasswordSchema, forgotPasswordSchema } from './authSchema.js';

const router = express.Router();

// Route đăng ký tài khoản mới (Công khai, đã gắn validate bằng Tiếng Việt)
router.post('/signup', validate(signUpSchema), authController.signUp);

// Route đăng nhập lấy token (Công khai, đã gắn validate bằng Tiếng Việt)
router.post('/signin', validate(signInSchema), authController.signIn);

// Route đồng bộ hồ sơ Giáo viên (Cần gửi kèm Token để xác thực danh tính)
router.post('/register-profile', authMiddleware, authController.registerTeacherProfile);

// Route lấy thông tin cá nhân của Giáo viên đang đăng nhập
router.get('/me', authMiddleware, authController.getProfile);

// Route đăng xuất (Cần gửi kèm Token)
router.post('/logout', authMiddleware, authController.signOut);

// Route đổi mật khẩu (Cần gửi kèm Token, đã gắn validate)
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

// Route yêu cầu khôi phục mật khẩu khi quên (Công khai, đã gắn validate)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// ── Google OAuth ────────────────────────────────────────────
// Bước 1: Redirect người dùng đến trang chọn tài khoản Google
router.get('/google', authController.googleAuth);

// Bước 2: FE gọi sau khi nhận được `code` từ Google callback
router.post('/google/exchange', authController.googleExchange);

export default router;

