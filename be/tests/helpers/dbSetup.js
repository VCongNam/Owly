export const assertTestDb = () => {
  const dbUrl = process.env.DATABASE_URL || '';

  // 1. Chặn đứng nếu thiếu DATABASE_URL khi chạy integration tests cần DB
  if (!dbUrl) {
    throw new Error(
      '[SAFETY GUARD] Thiếu biến môi trường DATABASE_URL cho integration tests.\n' +
      'Vui lòng cấu hình DATABASE_URL trỏ vào Test/Local Database.'
    );
  }

  // 2. Chặn đứng tuyệt đối nếu URL chứa các nhà cung cấp Cloud Database/Production Host
  const productionPatterns = [
    'supabase.co',
    'neon.tech',
    'planetscale.com',
    'railway.app',
    'render.com',
  ];

  const isProduction = productionPatterns.some((pattern) => dbUrl.includes(pattern));

  if (isProduction) {
    throw new Error(
      '[SAFETY GUARD] CẢNH BÁO BẢO MẬT: Integration test đang kết nối tới Production DB Cloud!\n' +
      'Yêu cầu sử dụng database test/local độc lập (ví dụ: localhost/docker postgres) để tránh mất mát dữ liệu!'
    );
  }
};
