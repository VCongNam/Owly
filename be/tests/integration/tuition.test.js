import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { TEACHER_ID, STUDENT_ID, CLASS_ID, INVOICE_ID, UNKNOWN_ID, TEACHER_TOKEN, STUDENT_TOKEN } from '../helpers/fixtures.js';

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

const mockInvoice = {
  id: INVOICE_ID,
  classId: CLASS_ID,
  studentId: STUDENT_ID,
  amount: 500000,
  status: 'Unpaid',
  class: {
    id: CLASS_ID,
    name: 'Lớp học Thử nghiệm',
    classCode: 'LH001',
    teacher: { fullName: 'Giáo viên A' }
  },
  transactions: []
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
    invoice: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === INVOICE_ID) return mockInvoice;
        return null;
      }),
      findMany: vi.fn().mockImplementation(async ({ where }) => {
        // Học sinh lọc theo studentId cá nhân
        if (where.studentId) {
          if (where.studentId === STUDENT_ID) return [mockInvoice];
          return [];
        }
        // Giáo viên lọc hóa đơn lớp mình quản lý
        if (where.class && where.class.teacherId) {
          if (where.class.teacherId === TEACHER_ID) return [mockInvoice];
          return [];
        }
        return [];
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        if (where.id === INVOICE_ID) {
          mockInvoice.status = data.status;
          return mockInvoice;
        }
        return null;
      })
    },
    transaction: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === UNKNOWN_ID) {
          return {
            id: UNKNOWN_ID,
            invoiceId: INVOICE_ID,
            invoice: {
              classId: CLASS_ID,
              class: { teacherId: TEACHER_ID }
            }
          };
        }
        return null;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        if (where.id === UNKNOWN_ID) {
          return {
            id: UNKNOWN_ID,
            transactionStatus: data.transactionStatus,
            processedById: data.processedById,
            rejectionReason: data.rejectionReason,
          };
        }
        return null;
      }),
      create: vi.fn().mockResolvedValue({ id: 'tx-new-001' })
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

describe('Security: Tuition Invoice Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoice.studentId = STUDENT_ID;
    mockInvoice.amount = 500000;
    mockInvoice.status = 'Unpaid';
  });

  // ── Xem hóa đơn cá nhân (Học sinh) ───────────────────────────────────────────
  it('chỉ trả về danh sách hóa đơn thuộc học sinh hiện tại', async () => {
    const res = await request(app)
      .get('/api/tuition/my-invoices')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].studentId).toBe(STUDENT_ID);
  });

  // ── Xem hóa đơn chờ duyệt (Giáo viên) ─────────────────────────────────────────
  it('chỉ trả về danh sách hóa đơn thuộc lớp học Giáo viên quản lý', async () => {
    const res = await request(app)
      .get('/api/tuition/teacher/pending')
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ── Phân quyền nộp proof học phí ────────────────────────────────────────────
  it('trả 403 khi Học sinh nộp minh chứng chuyển khoản (proof) cho hóa đơn của người khác', async () => {
    // Đổi chủ sở hữu hóa đơn sang học sinh khác
    mockInvoice.studentId = UNKNOWN_ID;

    const res = await request(app)
      .post(`/api/tuition/invoices/${INVOICE_ID}/submit-proof`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({
        proofUrl: 'http://image.proof/url.png',
        amountPaid: 500000,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ── Phê duyệt học phí ────────────────────────────────────────────────────────
  it('trả 403 khi Học sinh cố gắng duyệt/từ chối giao dịch thanh toán học phí', async () => {
    const res = await request(app)
      .patch(`/api/tuition/transactions/${UNKNOWN_ID}/review`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ status: 'Approved' });

    expect(res.status).toBe(403);
  });

  it('trả 403 khi Giáo viên không quản lý lớp cố duyệt giao dịch thanh toán học phí của lớp đó', async () => {
    // Tạm thời override lớp học thuộc giáo viên khác
    const { prisma } = await import('../../src/config/db.js');
    const originalFindUnique = prisma.transaction.findUnique;
    prisma.transaction.findUnique = vi.fn().mockResolvedValue({
      id: UNKNOWN_ID,
      invoice: {
        classId: UNKNOWN_ID,
        class: { teacherId: UNKNOWN_ID },
      },
    });

    try {
      const res = await request(app)
        .patch(`/api/tuition/transactions/${UNKNOWN_ID}/review`)
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({ status: 'Approved' });

      expect(res.status).toBe(403);
    } finally {
      prisma.transaction.findUnique = originalFindUnique;
    }
  });

  it('cập nhật hóa đơn thành Paid khi Giáo viên duyệt giao dịch (Approved) thành công', async () => {
    const res = await request(app)
      .patch(`/api/tuition/transactions/${UNKNOWN_ID}/review`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ status: 'Approved' });

    expect(res.status).toBe(200);
    expect(mockInvoice.status).toBe('Paid');
  });

  it('cập nhật hóa đơn thành Unpaid khi Giáo viên từ chối giao dịch (Rejected) thành công', async () => {
    const res = await request(app)
      .patch(`/api/tuition/transactions/${UNKNOWN_ID}/review`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ status: 'Rejected', rejectionReason: 'Minh chứng không hợp lệ' });

    expect(res.status).toBe(200);
    expect(mockInvoice.status).toBe('Unpaid');
  });

  it('trả 400 khi Giáo viên duyệt giao dịch với trạng thái không hợp lệ', async () => {
    const res = await request(app)
      .patch(`/api/tuition/transactions/${UNKNOWN_ID}/review`)
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ status: 'InvalidStatus' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Tài nguyên không tồn tại ──────────────────────────────────────────────────
  it('trả 404 khi nộp minh chứng cho hóa đơn không tồn tại', async () => {
    const res = await request(app)
      .post(`/api/tuition/invoices/${UNKNOWN_ID}/submit-proof`)
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({
        proofUrl: 'http://image.proof/url.png',
        amountPaid: 500000,
      });

    expect(res.status).toBe(404);
  });

  it('trả 404 khi duyệt giao dịch không tồn tại', async () => {
    const res = await request(app)
      .patch(`/api/tuition/transactions/${CLASS_ID}/review`) // CLASS_ID đóng vai trò transactionId không tồn tại trong mock
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
      .send({ status: 'Approved' });

    expect(res.status).toBe(404);
  });
});
