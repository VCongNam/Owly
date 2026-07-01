import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống').max(255, 'Họ và tên quá dài'),
  phone: z.string().max(50, 'Số điện thoại quá dài').optional().nullable()
});
