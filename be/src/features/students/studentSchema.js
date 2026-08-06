import { z } from 'zod';

// Regex validate số điện thoại Việt Nam tiêu chuẩn (03, 05, 07, 08, 09 kèm 8 chữ số)
const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

export const createAndEnrollStudentSchema = z.object({
  fullName: z.string({
    required_error: 'Họ và tên học viên không được để trống'
  }).min(2, 'Họ và tên học viên phải có ít nhất 2 ký tự').max(100, 'Họ và tên quá dài'),
  
  dateOfBirth: z.string({
    required_error: 'Ngày sinh không được để trống'
  }).datetime('Ngày sinh không đúng định dạng ISO 8601 (ví dụ: YYYY-MM-DDT00:00:00Z)'),
  
  parentPhone: z.string({
    required_error: 'Số điện thoại phụ huynh không được để trống'
  }).regex(phoneRegex, 'Số điện thoại phụ huynh không đúng định dạng di động Việt Nam'),
});

export const enrollExistingStudentSchema = z.object({
  studentId: z.string({
    required_error: 'ID học viên không được để trống'
  }).uuid('ID học viên không hợp lệ (phải là định dạng UUID)'),
});

export const studentUpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên học viên phải có ít nhất 2 ký tự').max(100, 'Họ và tên quá dài').optional(),
  
  dateOfBirth: z.string().datetime('Ngày sinh không đúng định dạng ISO 8601').optional(),
  
  phone: z.string().regex(phoneRegex, 'Số điện thoại học viên không đúng định dạng di động Việt Nam').optional().nullable(),
  
  parentPhone: z.string().regex(phoneRegex, 'Số điện thoại phụ huynh không đúng định dạng di động Việt Nam').optional(),
  
  email: z.string().email('Email cá nhân không đúng định dạng').optional(),
});

export const bulkCreateAndEnrollStudentSchema = z.object({
  students: z.array(z.object({
    fullName: z.string({
      required_error: 'Họ và tên học viên không được để trống'
    }).min(2, 'Họ và tên học viên phải có ít nhất 2 ký tự').max(100, 'Họ và tên quá dài'),
    
    dateOfBirth: z.string({
      required_error: 'Ngày sinh không được để trống'
    }).datetime('Ngày sinh không đúng định dạng ISO 8601 (ví dụ: YYYY-MM-DDT00:00:00Z)'),
    
    parentPhone: z.string({
      required_error: 'Số điện thoại phụ huynh không được để trống'
    }).regex(phoneRegex, 'Số điện thoại phụ huynh không đúng định dạng di động Việt Nam'),

    phone: z.string().regex(phoneRegex, 'Số điện thoại học viên không đúng định dạng di động Việt Nam').optional().nullable(),
    email: z.string().email('Email cá nhân không đúng định dạng').optional().nullable(),
  })).min(1, 'Danh sách học viên import không được để trống'),
});
