import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string({
    required_error: 'Nội dung thông báo không được để trống'
  })
  .min(1, 'Nội dung thông báo không được để trống')
  .max(5000, 'Nội dung thông báo không được vượt quá 5000 ký tự')
});

export const createCommentSchema = z.object({
  content: z.string({
    required_error: 'Nội dung bình luận không được để trống'
  })
  .min(1, 'Nội dung bình luận không được để trống')
  .max(1000, 'Nội dung bình luận không được vượt quá 1000 ký tự')
});
