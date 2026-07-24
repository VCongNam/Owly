import { z } from 'zod';

export const upsertClassTumSchema = z.object({
  amount: z.number({ required_error: 'Đơn giá học phí không được để trống' })
    .min(0, 'Đơn giá học phí không được là số âm'),
  billingCycle: z.string().default('Monthly'),
});

export const generateInvoicesSchema = z.object({
  billingMonth: z.string({ required_error: 'Vui lòng chọn tháng thu học phí' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Tháng thu học phí phải đúng định dạng YYYY-MM (Ví dụ: 2026-07)'),
  dueDate: z.string({ required_error: 'Ngày hạn nộp không được để trống' }),
  amountPerSession: z.number().min(0, 'Đơn giá học phí không được là số âm').optional(),
});

export const submitProofSchema = z.object({
  proofUrl: z.string({ required_error: 'Vui lòng tải lên ảnh minh chứng thanh toán' })
    .min(1, 'Ảnh minh chứng thanh toán không được để trống'),
  amountPaid: z.number({ required_error: 'Vui lòng nhập số tiền đã thanh toán' })
    .min(1, 'Số tiền thanh toán phải lớn hơn 0'),
});

export const reviewTransactionSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], { required_error: 'Trạng thái xét duyệt không hợp lệ' }),
  rejectionReason: z.string().optional(),
});
