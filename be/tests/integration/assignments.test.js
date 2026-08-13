// be/tests/integration/assignments.test.js
// Integration Security Tests cho Assignments
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { TEACHER_ID, STUDENT_ID, CLASS_ID, ASSIGNMENT_ID, UNKNOWN_ID, TEACHER_TOKEN, STUDENT_TOKEN } from '../helpers/fixtures.js';

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

const mockAssignment = {
  id: ASSIGNMENT_ID,
  title: 'Bài tập 1',
  classId: CLASS_ID,
  maxPoints: 10,
  dueDate: null,
  class: {
    teacherId: TEACHER_ID,
  }
};

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
        if (where.id === CLASS_ID) return { id: CLASS_ID, teacherId: TEACHER_ID };
        return null;
      }),
    },
    assignment: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === ASSIGNMENT_ID) return mockAssignment;
        return null;
      }),
    },
    submission: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === UNKNOWN_ID) {
          return {
            id: UNKNOWN_ID,
            assignment: {
              maxPoints: mockAssignment.maxPoints,
              class: {
                teacherId: mockAssignment.class.teacherId
              }
            }
          };
        }
        return null;
      }),
    },
    classEnrollment: {
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        if (where.studentId === STUDENT_ID && where.classId === CLASS_ID) {
          return { id: 'e-01', studentId: STUDENT_ID, classId: CLASS_ID, status: 'Active', isActive: true };
        }
        return null;
      }),
    },
  },
}));

import app from '../../src/app.js';
import { beforeEach } from 'vitest';

describe('Security: Assignment Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssignment.classId = CLASS_ID;
    mockAssignment.maxPoints = 10;
    mockAssignment.dueDate = null;
    mockAssignment.class.teacherId = TEACHER_ID;
  });

  // ── Học sinh nộp bài tập chéo lớp ─────────────────────────────────────────────
  it('trả 403 khi Học sinh cố gắng nộp bài cho lớp mình không tham gia học', async () => {
    // Đổi lớp của bài tập sang một lớp học sinh không có enrollment (dùng UNKNOWN_ID chuẩn)
    mockAssignment.classId = UNKNOWN_ID;

    const res = await request(app)
      .post(`/api/assignments/${ASSIGNMENT_ID}/submissions`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ content: 'Nội dung bài làm' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ── Học sinh nộp bài quá hạn (dueDate) ─────────────────────────────────────────
  it('trả 400 khi Học sinh nộp bài đã hết hạn nộp (dueDate trong quá khứ)', async () => {
    // Đặt hạn nộp bài trong quá khứ
    mockAssignment.dueDate = new Date('2020-01-01T00:00:00.000Z');

    const res = await request(app)
      .post(`/api/assignments/${ASSIGNMENT_ID}/submissions`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ content: 'Nội dung bài nộp muộn' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('hết hạn');
  });

  // ── Giáo viên khác sửa/xóa bài tập chéo lớp ────────────────────────────────────
  it('trả 403 khi Giáo viên không quản lý lớp cố sửa bài tập', async () => {
    mockAssignment.class.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .put(`/api/assignments/${ASSIGNMENT_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ title: 'Tên bài tập mới' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('trả 403 khi Giáo viên không quản lý lớp cố xóa bài tập', async () => {
    mockAssignment.class.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .delete(`/api/assignments/${ASSIGNMENT_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ── Chấm điểm bài làm ────────────────────────────────────────────────────────
  it('trả 403 khi Học sinh cố gắng chấm điểm hoặc sửa điểm bài nộp', async () => {
    const res = await request(app)
      .post(`/api/assignments/submissions/${UNKNOWN_ID}/feedback`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ grade: 9, remarks: 'Tốt' });

    expect(res.status).toBe(403);
  });

  it('trả 403 khi Giáo viên không quản lý lớp cố chấm điểm bài nộp', async () => {
    mockAssignment.class.teacherId = UNKNOWN_ID;

    const res = await request(app)
      .post(`/api/assignments/submissions/${UNKNOWN_ID}/feedback`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ grade: 8, remarks: 'Bài của lớp khác' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('trả 400 khi Giáo viên chấm điểm vượt mức điểm tối đa (maxPoints)', async () => {
    const res = await request(app)
      .post(`/api/assignments/submissions/${UNKNOWN_ID}/feedback`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ grade: 15, remarks: 'Điểm vượt tối đa' });

    // logic service sẽ chặn mức điểm lớn hơn maxPoints
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('trả 400 khi Giáo viên chấm điểm âm (grade < 0)', async () => {
    const res = await request(app)
      .post(`/api/assignments/submissions/${UNKNOWN_ID}/feedback`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ grade: -5, remarks: 'Điểm âm' });

    // Zod validation hoặc logic service sẽ chặn điểm âm
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Tài nguyên không tồn tại ──────────────────────────────────────────────────
  it('trả 404 khi truy cập Bài tập không tồn tại', async () => {
    const res = await request(app)
      .put(`/api/assignments/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ title: 'Bài tập ma' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả 404 khi truy cập Bài làm không tồn tại để chấm điểm', async () => {
    const res = await request(app)
      .post(`/api/assignments/submissions/${CLASS_ID}/feedback`) // CLASS_ID đóng vai trò submissionId không tồn tại trong mock
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ grade: 8, remarks: 'Chấm bài không tồn tại' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
