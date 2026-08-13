// be/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Chạy test tuần tự trong từng file, song song giữa các file
    globals: true,
    environment: 'node',
    // Đặt timeout cao hơn cho integration tests (cần khởi tạo DB)
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/config/**'],
    },
  },
});
