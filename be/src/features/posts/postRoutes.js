import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as postController from './postController.js';
import {
  classIdParamsSchema,
  idParamsSchema,
  postIdParamsSchema,
} from '../../validation/commonSchema.js';
import { paginationSchema } from '../../validation/paginationSchema.js';

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
router.post('/classes/:classId/posts',
  validate(classIdParamsSchema, 'params'),
  upload.array('files', 10),
  postController.createPost
);
router.get('/classes/:classId/posts',
  validate(classIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  postController.getClassPosts
);
router.get('/classes/:classId/upcoming-assignments',
  validate(classIdParamsSchema, 'params'),
  postController.getUpcomingAssignments
);
router.get('/posts/:id',
  validate(idParamsSchema, 'params'),
  postController.getPostDetails
);
router.put('/posts/:id/toggle-comments',
  validate(idParamsSchema, 'params'),
  postController.toggleComments
);
router.delete('/posts/:id',
  validate(idParamsSchema, 'params'),
  postController.deletePost
);

// ── QUẢN LÝ BÌNH LUẬN (COMMENTS) ────────────────────────────────────────────
router.post('/posts/:postId/comments',
  validate(postIdParamsSchema, 'params'),
  postController.createComment
);
router.delete('/comments/:id',
  validate(idParamsSchema, 'params'),
  postController.deleteComment
);

export default router;
