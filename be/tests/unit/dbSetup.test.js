// be/tests/unit/dbSetup.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assertTestDb } from '../helpers/dbSetup.js';

describe('Safety Guard: assertTestDb', () => {
  let originalEnvDbUrl;

  beforeEach(() => {
    originalEnvDbUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalEnvDbUrl !== undefined) {
      process.env.DATABASE_URL = originalEnvDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('ném lỗi ngay lập tức (fail-fast) nếu thiếu DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    expect(() => assertTestDb()).toThrow('Thiếu biến môi trường DATABASE_URL');
  });

  it('ném lỗi bảo mật nếu DATABASE_URL chứa các host cloud/production (supabase, neon, v.v.)', () => {
    const badUrls = [
      'postgresql://postgres:pass@db.supabase.co:5432/db',
      'postgres://user:pass@ep-cool-lake-123.neon.tech/neondb',
      'mysql://user:pass@aws.planetscale.com/db',
    ];

    for (const url of badUrls) {
      process.env.DATABASE_URL = url;
      expect(() => assertTestDb()).toThrow('CẢNH BÁO BẢO MẬT: Integration test đang kết nối tới Production DB Cloud!');
      // Đảm bảo không làm lộ một phần mật khẩu/URL
      try {
        assertTestDb();
      } catch (err) {
        expect(err.message).not.toContain(url.substring(0, 10));
      }
    }
  });

  it('hoạt động bình thường không ném lỗi nếu DATABASE_URL trỏ vào local/test database', () => {
    const safeUrls = [
      'postgresql://postgres:postgres@localhost:5432/owly_test',
      'postgresql://postgres:postgres@127.0.0.1:5432/owly_test',
    ];

    for (const url of safeUrls) {
      process.env.DATABASE_URL = url;
      expect(() => assertTestDb()).not.toThrow();
    }
  });
});
