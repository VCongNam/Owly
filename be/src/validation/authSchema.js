// be/src/validation/authSchema.js
import { z } from 'zod';

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

export const signUpSchema = z.object({
  email: z.string({
    required_error: 'Email không được để trống'
  })
  .min(1, 'Email không được để trống')
  .email('Email không đúng định dạng'),

  password: z.string({
    required_error: 'Mật khẩu không được để trống'
  })
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),

  fullName: z.string({
    required_error: 'Họ và tên không được để trống'
  })
  .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
  .max(100, 'Họ và tên không được vượt quá 100 ký tự'),

  phone: z.string({
    required_error: 'Số điện thoại không được để trống'
  })
  .min(1, 'Số điện thoại không được để trống')
  .regex(phoneRegex, 'Số điện thoại không đúng định dạng (Ví dụ: 0987654321)'),

  specializationIds: z.array(z.string().uuid('Mã chuyên môn không hợp lệ')).optional()
});

export const signInSchema = z.object({
  email: z.string({
    required_error: 'Email không được để trống'
  })
  .min(1, 'Email không được để trống')
  .email('Email không đúng định dạng'),

  password: z.string({
    required_error: 'Mật khẩu không được để trống'
  })
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

