// be/src/server.js
// Entry point cho ứng dụng khi chạy thật (dev/production)
// Tách khỏi app.js để Supertest/Vitest có thể import app mà không chiếm port HTTP
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
