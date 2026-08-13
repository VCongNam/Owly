// be/tests/helpers/authMock.js
// Cung cấp mock cho supabase.auth.getUser để integration tests không cần Supabase thật
// Import file này vào từng test trước khi import app

/**
 * Tạo mock user object cho authMiddleware.
 * userId: UUID hợp lệ để khớp với fixtures
 * role: 'teacher' | 'student' | 'admin'
 */
export const makeUser = (overrides = {}) => ({
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'teacher@test.com',
  role: 'teacher',
  user_metadata: {},
  ...overrides,
});

/**
 * Mock module supabase để getUser luôn trả về user hợp lệ.
 * Gọi trong vi.mock() trước mỗi describe block.
 *
 * Cách dùng:
 *   import { mockAuth } from '../helpers/authMock.js';
 *   vi.mock('../../src/config/supabase.js', () => mockAuth());
 */
export const mockAuth = (userOverrides = {}) => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: makeUser(userOverrides) },
        error: null,
      }),
    },
  },
});

/**
 * Mock auth để getUser trả về lỗi (token không hợp lệ)
 */
export const mockAuthFail = () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid token' },
      }),
    },
  },
});
