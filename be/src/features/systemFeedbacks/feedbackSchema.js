import { z } from 'zod';

export const createFeedbackSchema = z.object({
  type: z.enum(['Bug', 'FeatureRequest', 'GeneralFeedback'], {
    required_error: 'Loại phản hồi không được để trống',
    invalid_type_error: 'Loại phản hồi không hợp lệ'
  }),
  title: z.string({
    required_error: 'Tiêu đề không được để trống'
  })
  .min(1, 'Tiêu đề không được để trống')
  .max(255, 'Tiêu đề không được dài quá 255 ký tự'),
  content: z.string({
    required_error: 'Nội dung phản hồi không được để trống'
  })
  .min(10, 'Nội dung phản hồi phải dài ít nhất 10 ký tự'),
  attachmentUrls: z.array(z.string()).optional()
});
