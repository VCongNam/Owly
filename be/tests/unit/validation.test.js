// be/tests/unit/validation.test.js
// Unit tests cho Zod schemas — không cần server hoặc DB
import { describe, it, expect } from 'vitest';

import { isoDateSchema, studentScheduleQuerySchema, idParamsSchema } from '../../src/validation/commonSchema.js';
import { paginationSchema } from '../../src/validation/paginationSchema.js';
import {
  createAndEnrollStudentSchema,
  studentUpdateProfileSchema,
} from '../../src/features/students/studentSchema.js';

// ── isoDateSchema ──────────────────────────────────────────────────────────────
describe('isoDateSchema', () => {
  it('chấp nhận ngày YYYY-MM-DD hợp lệ', () => {
    expect(isoDateSchema.safeParse('2026-01-01').success).toBe(true);
    expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true); // 2024 là năm nhuận
    expect(isoDateSchema.safeParse('2025-12-31').success).toBe(true);
  });

  it('từ chối định dạng sai (không phải YYYY-MM-DD)', () => {
    expect(isoDateSchema.safeParse('01/01/2026').success).toBe(false);
    expect(isoDateSchema.safeParse('2026-1-1').success).toBe(false);
    expect(isoDateSchema.safeParse('20260101').success).toBe(false);
    expect(isoDateSchema.safeParse('').success).toBe(false);
  });

  it('từ chối ngày không tồn tại trên lịch', () => {
    expect(isoDateSchema.safeParse('2025-02-29').success).toBe(false); // 2025 không nhuận
    expect(isoDateSchema.safeParse('2026-02-29').success).toBe(false);
    expect(isoDateSchema.safeParse('2026-04-31').success).toBe(false); // Tháng 4 chỉ có 30 ngày
    expect(isoDateSchema.safeParse('2026-99-99').success).toBe(false); // Tháng và ngày phi lý
    expect(isoDateSchema.safeParse('2026-13-01').success).toBe(false); // Tháng 13
  });

  it('chấp nhận 29/02 đúng khi là năm nhuận', () => {
    expect(isoDateSchema.safeParse('2028-02-29').success).toBe(true); // 2028 là năm nhuận
    expect(isoDateSchema.safeParse('2000-02-29').success).toBe(true); // 2000 là năm nhuận (chia hết 400)
    expect(isoDateSchema.safeParse('1900-02-29').success).toBe(false); // 1900 không nhuận (chia hết 100 không chia hết 400)
  });
});

// ── studentScheduleQuerySchema ──────────────────────────────────────────────────
describe('studentScheduleQuerySchema', () => {
  it('hợp lệ khi không có tham số nào', () => {
    expect(studentScheduleQuerySchema.safeParse({}).success).toBe(true);
  });

  it('hợp lệ khi startDate và endDate cùng ngày', () => {
    const result = studentScheduleQuerySchema.safeParse({
      startDate: '2026-01-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('hợp lệ khi startDate < endDate', () => {
    const result = studentScheduleQuerySchema.safeParse({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.success).toBe(true);
  });

  it('từ chối khi startDate > endDate', () => {
    const result = studentScheduleQuerySchema.safeParse({
      startDate: '2026-01-31',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
    // Sử dụng optional chaining đầy đủ để tương thích với Zod v4 issues format
    expect(result.error?.issues?.[0]?.message ?? result.error?.errors?.[0]?.message).toBeTruthy();
  });

  it('từ chối ngày không tồn tại trong khoảng', () => {
    const result = studentScheduleQuerySchema.safeParse({
      startDate: '2025-02-29',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });
});

// ── Phone regex trong studentSchema ──────────────────────────────────────────────
describe('studentSchema — phone validation', () => {
  const validPhones = ['0311234567', '0511234567', '0711234567', '0811234567', '0911234567'];
  const invalidPhones = [
    '1234567890',   // không bắt đầu bằng 0
    '0211234567',   // đầu 02 không hợp lệ
    '031123456',    // thiếu 1 số (8 thay vì 9 số)
    '03112345678',  // thừa 1 số (10 thay vì 9 số)
    '',
  ];

  it('chấp nhận số điện thoại Việt Nam hợp lệ', () => {
    for (const phone of validPhones) {
      const r = createAndEnrollStudentSchema.shape.parentPhone.safeParse(phone);
      expect(r.success, `${phone} nên hợp lệ`).toBe(true);
    }
  });

  it('từ chối số điện thoại không hợp lệ', () => {
    for (const phone of invalidPhones) {
      const r = createAndEnrollStudentSchema.shape.parentPhone.safeParse(phone);
      expect(r.success, `${phone} nên không hợp lệ`).toBe(false);
    }
  });

  it('từ chối số điện thoại chứa ký tự đặc biệt hoặc ký tự |', () => {
    const r1 = createAndEnrollStudentSchema.shape.parentPhone.safeParse('03|1234567');
    const r2 = createAndEnrollStudentSchema.shape.parentPhone.safeParse('035|789012');
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });
});

// ── Pagination Schema & UUID Validation ─────────────────────────────────────────
describe('Pagination & UUID Schemas', () => {
  it('validate page/limit hợp lệ và ép kiểu thành công', () => {
    const r = paginationSchema.safeParse({ page: '2', limit: '15' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(2);
      expect(r.data.limit).toBe(15);
    }
  });

  it('từ chối page <= 0, limit <= 0 hoặc limit > 100', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: -5 }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('từ chối page hoặc limit có giá trị không phải số', () => {
    expect(paginationSchema.safeParse({ page: 'abc' }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: 'xyz' }).success).toBe(false);
  });

  it('từ chối UUID không hợp lệ', () => {
    // Lấy đại diện schema nhận UUID từ commonSchema đã được import tĩnh
    expect(idParamsSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
    expect(idParamsSchema.safeParse({ id: '12345' }).success).toBe(false);
  });
});

// ── Bổ sung test chỉ truyền startDate hoặc endDate ──────────────────────────────
describe('studentScheduleQuerySchema — optional bounds', () => {
  it('chấp nhận nếu chỉ truyền duy nhất startDate', () => {
    const r = studentScheduleQuerySchema.safeParse({ startDate: '2026-01-01' });
    expect(r.success).toBe(true);
  });

  it('chấp nhận nếu chỉ truyền duy nhất endDate', () => {
    const r = studentScheduleQuerySchema.safeParse({ endDate: '2026-01-01' });
    expect(r.success).toBe(true);
  });
});

