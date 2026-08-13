// be/src/middlewares/auth.js
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/appError.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ header Authorization (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Mã xác thực (Token) bị thiếu hoặc không hợp lệ', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Sử dụng Supabase SDK để xác thực token và lấy thông tin User
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Lỗi xác thực Token:', error?.message || 'User is null');
      return next(new AppError('Mã xác thực không chính xác hoặc đã hết hạn', 401));
    }

    // 3. Lấy role từ database để gán vào req.user
    const { prisma } = await import('../config/db.js');
    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
        studentProfile: true,
        adminProfile: true
      }
    });

    if (account) {
      if (account.teacherProfile) user.role = 'teacher';
      else if (account.studentProfile) user.role = 'student';
      else if (account.adminProfile) user.role = 'admin';
      else user.role = 'unknown';
    } else {
      user.role = 'unknown';
    }

    // 4. Gán thông tin user vào request object để sử dụng ở các controller tiếp theo
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
