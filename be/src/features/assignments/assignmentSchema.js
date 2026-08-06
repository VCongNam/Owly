import { z } from 'zod';

export const createAssignmentSchema = z.object({
  classId: z.string().uuid('ID lớp học không hợp lệ'),
  gradeCategoryId: z.string().uuid('ID danh mục điểm không hợp lệ').optional().nullable(),
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

export const createSubmissionSchema = z.object({
  content: z.string().min(1, 'Nội dung nộp bài (liên kết tệp) không được để trống')
});

export const gradeSubmissionSchema = z.object({
  grade: z.coerce.number().min(0, 'Điểm số không được nhỏ hơn 0'),
  remarks: z.string().min(1, 'Nhận xét chấm bài không được để trống'),
  attachmentUrl: z.string().url('URL tệp chữa bài không hợp lệ').optional().nullable()
});
