// be/tests/integration/auth.test.js
// Security tests: 401/403 cho authentication flow
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { TEACHER_ID, TEACHER_TOKEN, INVALID_TOKEN } from '../helpers/fixtures.js';

// Mock supabase
vi.mock('../../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token) => {
        if (token === TEACHER_TOKEN) {
          return {
            data: {
              user: {
                id: TEACHER_ID,
                email: 'teacher@test.com',
                user_metadata: {},
              },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: { message: 'invalid token' } };
      }),
    },
  },
}));

// Mock prisma
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    account: {
      findUnique: vi.fn().mockResolvedValue({
        id: TEACHER_ID,
        teacherProfile: { id: 'tp-001' },
        studentProfile: null,
        adminProfile: null,
      }),
    },
    class: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import app from '../../src/app.js';

describe('Security: Authentication Guards', () => {
  // ── 401: Thiếu Authorization Header ────────────────────────────────────────
  it('trả 401 khi GET /api/classes không có token', async () => {
    const res = await request(app).get('/api/classes');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('trả 401 khi POST /api/classes không có token', async () => {
    const res = await request(app).post('/api/classes').send({ name: 'Test' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('trả 401 khi GET /api/assignments không có token', async () => {
    const res = await request(app).get('/api/assignments/teacher/upcoming');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── 401: Token không hợp lệ ────────────────────────────────────────────────
  it('trả 401 khi Bearer token không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${INVALID_TOKEN}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // ── 404: Route không tồn tại ────────────────────────────────────────────────
  it('trả 404 với errors:[] cho route không tồn tại (không có /api prefix)', async () => {
    const res = await request(app).get('/xyz-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(typeof res.body.message).toBe('string');
  });

  // ── 200: Token hợp lệ → success ────────────────────────────────────────────
  it('trả 200 khi token hợp lệ cho GET /api/classes', async () => {
    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${TEACHER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
