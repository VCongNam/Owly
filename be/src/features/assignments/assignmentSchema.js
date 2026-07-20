import { z } from 'zod';

export const createAssignmentSchema = z.object({
  classId: z.string().uuid('ID lớp học không hợp lệ'),
  gradeCategoryId: z.string().uuid('ID danh mục điểm không hợp lệ'),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  dueDate: z.string().datetime('Ngày hạn nộp không hợp lệ (phải là chuẩn ISO)'),
  maxPoints: z.coerce.number().min(0, 'Điểm tối đa phải lớn hơn hoặc bằng 0'),
  attachmentUrls: z.array(z.string().url('URL đính kèm không hợp lệ')).optional()
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').optional(),
  dueDate: z.string().datetime('Ngày hạn nộp không hợp lệ').optional(),
  maxPoints: z.coerce.number().min(0).optional(),
  attachmentUrls: z.array(z.string().url('URL đính kèm không hợp lệ')).optional()
});
