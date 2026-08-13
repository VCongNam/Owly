import * as authService from './authService.js';
import { AppError } from '../../utils/appError.js';

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token không được để trống', 400));
    }

    const result = await authService.refreshSession(token);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Đăng ký tài khoản mới trên Supabase Auth + Tự động sinh hồ sơ Giáo viên
export const signUp = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, specializationIds } = req.body;

    if (!email || !password || !fullName || !phone) {
      return next(new AppError('Các trường email, password, fullName và phone là bắt buộc', 400));
    }

    const result = await authService.signUpTeacher(
      email,
      password,
      fullName,
      phone,
      specializationIds
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản giáo viên thành công',
      data: {
        user: {
          id: result.userId,
          email: result.email,
          fullName: result.fullName,
          teacherCode: result.teacherCode,
          phone: result.phone,
          specializations: result.specializations
        },
        token: result.token
      }
    });
  } catch (error) {
    // Ánh xạ lỗi bên thứ ba (Supabase) thành AppError thân thiện trước khi chuyển tiếp
    const msg = error.message || '';
    if (msg.includes('User already registered')) {
      return next(new AppError('Email này đã được đăng ký tài khoản', 409));
    }
    if (msg.includes('Password should be')) {
      return next(new AppError('Mật khẩu không đáp ứng yêu cầu độ bảo mật', 400));
    }
    next(error);
  }
};

// Đồng bộ/Tạo mới hồ sơ Giáo viên sau khi đã đăng ký trên Supabase Auth
export const registerTeacherProfile = async (req, res, next) => {
  try {
    const { fullName, specializationIds } = req.body;

    // req.user được gán từ authMiddleware sau khi xác thực Token thành công
    const userId = req.user.id;
    const email = req.user.email;

    if (!fullName) {
      return next(new AppError('Họ và tên không được để trống', 400));
    }

    const profile = await authService.createTeacherProfile({
      userId,
      email,
      fullName,
      specializationIds
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo hồ sơ giáo viên thành công',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin hồ sơ của Giáo viên đang đăng nhập
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let profile = await authService.getMyProfile(userId);

    if (!profile) {
      // Tự động đồng bộ/tạo hồ sơ từ metadata của Supabase Auth nếu chưa có (ví dụ cho OAuth Facebook/Google trực tiếp)
      await authService.ensureTeacherProfile({
        id: userId,
        email: req.user.email,
        user_metadata: req.user.user_metadata || {}
      });
      profile = await authService.getMyProfile(userId);
    }

    if (!profile) {
      return next(new AppError('Không tìm thấy thông tin hồ sơ. Vui lòng đăng ký hồ sơ trước.', 404));
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Đăng nhập tài khoản bằng email & password
export const signIn = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const result = await authService.signInUser(email, password, role);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    // Ánh xạ lỗi bên thứ ba (Supabase) thành AppError thân thiện với đúng status code
    const msg = error.message || '';
    if (msg.includes('Invalid login credentials')) {
      return next(new AppError('Email hoặc mật khẩu không chính xác', 401));
    }
    if (msg.includes('không đăng ký vai trò')) {
      return next(new AppError(msg, 403));
    }
    // Lỗi AppError từ service sẽ được giữ nguyên status code
    next(error);
  }
};

// ── Google OAuth ────────────────────────────────────────────────

/**
 * Bước 1: Tạo Google OAuth URL và redirect người dùng đến Google.
 * Domain hiển thị trên màn hình chọn tài khoản Google sẽ là FRONTEND_URL.
 */
export const googleAuth = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!clientId || !frontendUrl) {
      return next(new AppError('GOOGLE_CLIENT_ID hoặc FRONTEND_URL chưa được cấu hình', 500));
    }

    // redirect_uri trỏ về FE — đây là domain Google sẽ hiển thị
    const redirectUri = `${frontendUrl}/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Bước 2: FE gửi `code` nhận được từ Google lên đây để đổi lấy Supabase session.
 */
export const googleExchange = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return next(new AppError('Thiếu authorization code từ Google', 400));
    }

    const result = await authService.exchangeGoogleCode(code);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new AppError('Mã xác thực bị thiếu', 400));
    }
    const token = authHeader.split(' ')[1];
    await authService.signOutTeacher(token);
    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;
    await authService.changeTeacherPassword(userId, newPassword);
    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect to auth callback recovery
    const redirectTo = `${frontendUrl}/auth/callback`;
    await authService.forgotTeacherPassword(email, redirectTo);
    return res.status(200).json({
      success: true,
      message: 'Email khôi phục mật khẩu đã được gửi'
    });
  } catch (error) {
    next(error);
  }
};
