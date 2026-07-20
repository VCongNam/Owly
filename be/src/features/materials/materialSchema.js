import { z } from 'zod';

export const createMaterialSchema = z.object({
  title: z.string()
    .max(255, 'Tiêu đề tài liệu không được vượt quá 255 ký tự')
    .optional(),
  
  description: z.string()
    .max(1000, 'Mô tả tài liệu không được vượt quá 1000 ký tự')
    .optional()
});
