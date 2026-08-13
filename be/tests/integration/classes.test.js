// be/tests/integration/classes.test.js
// Integration Security Tests cho Class & Enrollment flow
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { TEACHER_ID, STUDENT_ID, CLASS_ID, UNKNOWN_ID, TEACHER_TOKEN, STUDENT_TOKEN } from '../helpers/fixtures.js';

// Mock Supabase Auth
vi.mock('../../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token) => {
        if (token === TEACHER_TOKEN) {
          return { data: { user: { id: TEACHER_ID, email: 'teacher@test.com' } }, error: null };
        }
        if (token === STUDENT_TOKEN) {
          return { data: { user: { id: STUDENT_ID, email: 'student@test.com' } }, error: null };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      }),
    },
  },
}));

// Mock database (Prisma)
const mockClass = {
  id: CLASS_ID,
  name: 'Lớp học Thử nghiệm',
  teacherId: TEACHER_ID,
  startDate: new Date(),
  createdAt: new Date(),
  teacher: { fullName: 'Giáo viên A', teacherCode: 'GV001' },
  subject: { id: 'subj-01', name: 'Toán' },
  schedules: [],
  tuitionConfig: null,
  _count: { enrollments: 0 }
};

let mockEnrollmentMode = 'active'; // 'active' | 'inactive' | 'missing'

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    account: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === TEACHER_ID) {
          return { id: TEACHER_ID, teacherProfile: { id: TEACHER_ID }, studentProfile: null, adminProfile: null };
        }
        if (where.id === STUDENT_ID) {
          return { id: STUDENT_ID, teacherProfile: null, studentProfile: { id: STUDENT_ID }, adminProfile: null };
        }
        return null;
      }),
    },
    class: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === CLASS_ID) return mockClass;
        return null;
      }),
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        // Chỉ trả về lớp học nếu classId và teacherId trùng khớp hoàn toàn với trạng thái mockClass
        if (where.id === CLASS_ID && where.teacherId === mockClass.teacherId) return mockClass;
        return null;
      }),
    },
    student: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === STUDENT_ID) return { id: STUDENT_ID, fullName: 'Hoc Sinh Test' };
        return null;
      }),
    },
    // Mock kiểm tra quyền chéo lớp học của học sinh ( classEnrollment )
    classEnrollment: {
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        // Chỉ cho phép học sinh STUDENT_ID truy cập lớp CLASS_ID
        if (where.studentId === STUDENT_ID && where.classId === CLASS_ID) {
          // Nếu query yêu cầu tìm bản ghi active (isActive: true) nhưng trạng thái là inactive thì trả về null
          if (where.isActive === true && mockEnrollmentMode === 'inactive') {
            return null;
          }
          if (mockEnrollmentMode === 'active') {
            return { id: 'e-01', studentId: STUDENT_ID, classId: CLASS_ID, status: 'Active', isActive: true };
          }
          if (mockEnrollmentMode === 'inactive') {
            return { id: 'e-01', studentId: STUDENT_ID, classId: CLASS_ID, status: 'Inactive', isActive: false };
          }
        }
        return null;
      }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import app from '../../src/app.js';
import { beforeEach } from 'vitest';

describe('Security: Class & Member Enrollment Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable fixture về trạng thái ban đầu
    mockClass.teacherId = TEACHER_ID;
    mockClass.name = 'Lớp học Thử nghiệm';
    mockEnrollmentMode = 'active';
  });

  // ── Phân quyền Giáo viên tạo lớp ──────────────────────────────────────────────
  it('trả 403 khi Học sinh cố gắng tạo lớp học với payload hợp lệ', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({
        name: 'Lớp Công nghệ mới',
        startDate: '2026-08-10T12:00:00.000Z',
        subjectId: UNKNOWN_ID
      });

    // Phải trả về chính xác 403 cấm truy cập thay vì lỗi validation 400
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // ── Bảo vệ chéo lớp học (Cross-class access) ──────────────────────────────
  it('trả 403 khi Giáo viên không dạy lớp đó yêu cầu xóa lớp học', async () => {
    // Override mockClass để giáo viên khác quản lý lớp
    mockClass.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .delete(`/api/classes/${CLASS_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('quyền');
  });

  it('trả 403 khi Giáo viên không dạy lớp đó yêu cầu sửa lớp học', async () => {
    mockClass.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .put(`/api/classes/${CLASS_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ name: 'Tên lớp mới', startDate: '2026-08-10T12:00:00.000Z' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('trả 404 khi Giáo viên không dạy lớp đó cố thêm học viên vào lớp', async () => {
    mockClass.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .post(`/api/classes/${CLASS_ID}/members/enroll-existing`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ studentId: STUDENT_ID });

    // Trả về 404 theo logic thực tế của studentService (Không tìm thấy hoặc không có quyền sở hữu)
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ── Học sinh truy cập lớp học chéo lớp / inactive ──────────────────────────────
  it('trả 403 khi Học sinh cố xem chi tiết lớp học mình không ghi danh', async () => {
    // Không có bản ghi ghi danh
    mockEnrollmentMode = 'missing';

    const res = await request(app)
      .get(`/api/classes/${CLASS_ID}`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('trả 403 khi Học sinh cố xem chi tiết lớp học mình có ghi danh nhưng inactive', async () => {
    // Bản ghi ghi danh không hoạt động
    mockEnrollmentMode = 'inactive';

    const res = await request(app)
      .get(`/api/classes/${CLASS_ID}`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('trả 403 khi Giáo viên không dạy lớp đó cố xem chi tiết lớp học', async () => {
    mockClass.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .get(`/api/classes/${CLASS_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

    expect(res.status).toBe(403);
  });

  it('trả 404 khi xem lớp học không tồn tại', async () => {
    const res = await request(app)
      .get(`/api/classes/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
