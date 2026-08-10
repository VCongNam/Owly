import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string({
    required_error: 'Tên lớp không được để trống'
  }).min(2, 'Tên lớp phải có ít nhất 2 ký tự').max(255, 'Tên lớp quá dài'),
  
  startDate: z.string({
    required_error: 'Ngày khai giảng không được để trống'
  }).datetime('Ngày khai giảng không đúng định dạng ISO 8601'),

  expectedEndDate: z.string().datetime('Ngày bế mạc không đúng định dạng ISO 8601').optional().nullable(),
  
  subjectId: z.string().uuid('Môn học không hợp lệ').optional().nullable(),

  status: z.enum(['Scheduled', 'OnGoing', 'Completed', 'Archived']).optional(),

  tuitionAmount: z.number().min(0, 'Học phí không được phép nhỏ hơn 0').optional().nullable(),
  
  billingCycle: z.enum(['Session', 'Monthly']).optional().nullable(),

  schedules: z.array(
    z.object({
      dayOfWeek: z.number().min(2, 'Thứ không hợp lệ').max(8, 'Thứ không hợp lệ'), // 2 = Thứ 2, 8 = Chủ nhật
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không đúng định dạng HH:mm'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không đúng định dạng HH:mm'),
      room: z.string().max(100, 'Tên phòng học quá dài').optional().nullable()
    })
  ).optional()
});

export const updateClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp phải có ít nhất 2 ký tự').max(255, 'Tên lớp quá dài').optional(),
  
  startDate: z.string().datetime('Ngày khai giảng không đúng định dạng ISO 8601').optional(),

  expectedEndDate: z.string().datetime('Ngày bế mạc không đúng định dạng ISO 8601').optional().nullable(),

  subjectId: z.string().uuid('Môn học không hợp lệ').optional().nullable(),

  status: z.enum(['Scheduled', 'OnGoing', 'Completed', 'Archived']).optional(),

  tuitionAmount: z.number().min(0, 'Học phí không được phép nhỏ hơn 0').optional().nullable(),
  
  billingCycle: z.enum(['Session', 'Monthly']).optional().nullable(),

  schedules: z.array(
    z.object({
      dayOfWeek: z.number().min(2, 'Thứ không hợp lệ').max(8, 'Thứ không hợp lệ'),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không đúng định dạng HH:mm'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không đúng định dạng HH:mm'),
      room: z.string().max(100, 'Tên phòng học quá dài').optional().nullable()
    })
  ).optional()
});

