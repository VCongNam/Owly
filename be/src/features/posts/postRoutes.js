import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import * as postController from './postController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB cho mỗi file đính kèm bảng tin
  }
});

// Tất cả các route đều yêu cầu đăng nhập
router.use(authMiddleware);

// ── QUẢN LÝ BÀI ĐĂNG (POSTS) ────────────────────────────────────────────────
router.post('/classes/:classId/posts', upload.array('files', 10), postController.createPost);
router.get('/classes/:classId/posts', postController.getClassPosts);
router.get('/classes/:classId/upcoming-assignments', postController.getUpcomingAssignments);
router.get('/posts/:id', postController.getPostDetails);
router.put('/posts/:id/toggle-comments', postController.toggleComments);
router.delete('/posts/:id', postController.deletePost);

// ── QUẢN LÝ BÌNH LUẬN (COMMENTS) ────────────────────────────────────────────
router.post('/posts/:postId/comments', postController.createComment);
router.delete('/comments/:id', postController.deleteComment);

export default router;
