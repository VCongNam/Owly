import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống').max(255, 'Họ và tên quá dài').optional().nullable(),
  phone: z.string().max(50, 'Số điện thoại quá dài').optional().nullable(),
  bankName: z.string().max(100, 'Tên ngân hàng quá dài').optional().nullable(),
  bankAccountNo: z.string().max(50, 'Số tài khoản quá dài').optional().nullable(),
  bankAccountName: z.string().max(150, 'Tên chủ tài khoản quá dài').optional().nullable(),
  bankBin: z.string().max(20, 'Mã BIN ngân hàng quá dài').optional().nullable(),
  bio: z.string().optional().nullable(),
  metadata: z.any().optional(),
  specializationIds: z.array(z.string().uuid()).optional(),
  // Học sinh
  dateOfBirth: z.string().optional().nullable(),
  parentPhone: z.string().max(50, 'Số điện thoại phụ huynh quá dài').optional().nullable(),
  email: z.string().email('Email không đúng định dạng').optional().nullable()
});
