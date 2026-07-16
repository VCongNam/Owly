import { z } from 'zod';

export const setupRecurringScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().min(2, 'Thứ không hợp lệ (phải từ 2 đến 8)').max(8, 'Thứ không hợp lệ (phải từ 2 đến 8)'), // 2 = Thứ 2, 8 = Chủ nhật
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không đúng định dạng HH:mm'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không đúng định dạng HH:mm'),
      room: z.string().max(100, 'Tên phòng học quá dài').optional().nullable()
    })
  , {
    required_error: 'Danh sách lịch học cố định không được để trống'
  }),
  generationRange: z.object({
    startDate: z.string({
      required_error: 'Ngày bắt đầu sinh lịch không được để trống'
    }).datetime('Ngày bắt đầu sinh lịch không đúng định dạng ISO 8601'),
    endDate: z.string({
      required_error: 'Ngày kết thúc sinh lịch không được để trống'
    }).datetime('Ngày kết thúc sinh lịch không đúng định dạng ISO 8601')
  }).refine((data) => {
    return new Date(data.startDate) < new Date(data.endDate);
  }, {
    message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
    path: ['startDate']
  })
});

export const createSessionSchema = z.object({
  title: z.string().min(1, 'Tiêu đề buổi học không được để trống').max(255, 'Tiêu đề quá dài').optional().nullable(),
  date: z.string({
    required_error: 'Thời gian buổi học không được để trống'
  }).datetime('Thời gian buổi học không đúng định dạng ISO 8601')
});

export const updateSessionSchema = z.object({
  title: z.string().min(1, 'Tiêu đề buổi học không được để trống').max(255, 'Tiêu đề quá dài').optional().nullable(),
  date: z.string().datetime('Thời gian buổi học không đúng định dạng ISO 8601').optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled'], {
    errorMap: () => ({ message: 'Trạng thái buổi học không hợp lệ (Scheduled, Completed, Cancelled)' })
  }).optional()
});

export const getSessionsQuerySchema = z.object({
  startDate: z.string({
    required_error: 'Ngày bắt đầu tìm kiếm không được để trống'
  }),
  endDate: z.string({
    required_error: 'Ngày kết thúc tìm kiếm không được để trống'
  })
});
