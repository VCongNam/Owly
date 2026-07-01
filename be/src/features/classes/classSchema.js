import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string({
    required_error: 'Tên lớp không được để trống'
  }).min(2, 'Tên lớp phải có ít nhất 2 ký tự').max(255, 'Tên lớp quá dài'),
  
  startDate: z.string({
    required_error: 'Ngày khai giảng không được để trống'
  }).datetime('Ngày khai giảng không đúng định dạng ISO 8601'),

  status: z.string().optional()
});

export const updateClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp phải có ít nhất 2 ký tự').max(255, 'Tên lớp quá dài').optional(),
  
  startDate: z.string().datetime('Ngày khai giảng không đúng định dạng ISO 8601').optional(),

  status: z.string().optional()
});
