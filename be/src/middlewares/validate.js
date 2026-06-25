// be/src/middlewares/validate.js
export const validate = (schema) => (req, res, next) => {
  try {
    // Chỉ validate req.body, nếu cần mở rộng có thể validate req.query hoặc req.params
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: formattedErrors
      });
    }
    next(error);
  }
};
