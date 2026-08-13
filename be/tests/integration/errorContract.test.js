// be/tests/integration/errorContract.test.js
// Integration tests kiểm tra Error Contract — mọi lỗi phải có { success: false, message, errors[] }
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock supabase trước khi import app
vi.mock('../../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid token' },
      }),
    },
  },
}));

// Mock prisma để không cần DB thật
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    account: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

import app from '../../src/app.js';

describe('Error Contract — cấu trúc response lỗi', () => {
  // ── 401 Unauthorized (thiếu token) ────────────────────────────────────────────
  it('trả { success:false, message, errors:[] } khi thiếu Authorization header', async () => {
    const res = await request(app).get('/api/classes');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('trả { success:false, message, errors:[] } khi token không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // ── 404 Route Not Found ────────────────────────────────────────────────────────
  // Dùng path không có tiền tố /api để tránh bị chặn bởi router-level authMiddleware
  it('trả { success:false, message, errors:[] } cho route không tồn tại', async () => {
    const res = await request(app).get('/definitely-not-a-real-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // ── 400 Validation Error (Zod via validate middleware) ────────────────────────
  it('trả { success:false, message, errors:[] } và HTTP 400 khi validation thất bại', async () => {
    // Endpoint login không cần auth token nhưng cần body hợp lệ
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'not-an-email', password: '' });
    
    // Đảm bảo trả đúng mã trạng thái HTTP 400 Bad Request
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

// ── SePay Feature Flag 503 ────────────────────────────────────────────────────
describe('SePay Feature Flag', () => {
  it('trả 503 với errors:[] khi SEPAY_ENABLED không phải "true"', async () => {
    // Đảm bảo feature flag tắt và khôi phục an toàn bằng try-finally
    const originalEnv = process.env.SEPAY_ENABLED;
    process.env.SEPAY_ENABLED = 'false';

    try {
      const res = await request(app)
        .post('/api/tuition/webhook/sepay')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({
        success: false,
        message: expect.stringContaining('SePay'),
      });
      expect(Array.isArray(res.body.errors)).toBe(true);
    } finally {
      if (originalEnv !== undefined) {
        process.env.SEPAY_ENABLED = originalEnv;
      } else {
        delete process.env.SEPAY_ENABLED;
      }
    }
  });
});
