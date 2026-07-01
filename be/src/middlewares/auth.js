// be/src/middlewares/auth.js
import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ header Authorization (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Mã xác thực (Token) bị thiếu hoặc không hợp lệ'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Sử dụng Supabase SDK để xác thực token và lấy thông tin User
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Lỗi xác thực Token:', error?.message || 'User is null', 'Token:', token.substring(0, 20) + '...');
      return res.status(401).json({
        success: false,
        message: 'Mã xác thực không chính xác hoặc đã hết hạn'
      });
    }

    // 3. Gán thông tin user vào request object để sử dụng ở các controller tiếp theo
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống trong quá trình xác thực tài khoản',
      errors: [error.message]
    });
  }
};
