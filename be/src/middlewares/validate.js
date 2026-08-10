// be/src/middlewares/validate.js
// target: 'body' | 'query' | 'params' — mặc định là 'body'
export const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: formattedErrors
    });
  }

  // Ghi lại dữ liệu đã được coerce/default bởi Zod để controller nhận giá trị đã chuẩn hóa
  req[target] = result.data;
  next();
};
