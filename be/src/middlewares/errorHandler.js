// be/src/middlewares/errorHandler.js
// Global Express error handler — phải có đúng 4 tham số để Express nhận diện là error middleware
// và phải được đăng ký SAU tất cả routes trong app.js
export const errorHandler = (err, req, res, next) => {
  // AppError có statusCode và isOperational; Error thường không có
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  // Lỗi nghiệp vụ (AppError): trả message gốc — đã được viết bằng tiếng Việt thân thiện
  // Lỗi hệ thống (Error thường / lỗi Prisma, v.v.): ẩn chi tiết, chỉ báo lỗi chung
  const message = isOperational ? err.message : 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau';

  const response = {
    success: false,
    message,
  };

  // Chỉ expose stack trace trong development để debug
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
