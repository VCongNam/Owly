import * as authService from './authService.js';

// Đăng ký tài khoản mới trên Supabase Auth + Tự động sinh hồ sơ Giáo viên
export const signUp = async (req, res) => {
  try {
    const { email, password, fullName, phone, specializationIds } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Các trường email, password, fullName và phone là bắt buộc'
      });
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
      data: result
    });
  } catch (error) {
    let msg = error.message;
    if (msg.includes('User already registered')) {
      msg = 'Email này đã được đăng ký tài khoản';
    } else if (msg.includes('Password should be')) {
      msg = 'Mật khẩu không đáp ứng yêu cầu độ bảo mật';
    }
    
    return res.status(500).json({
      success: false,
      message: msg || 'Đăng ký tài khoản giáo viên thất bại'
    });
  }
};

// Đồng bộ/Tạo mới hồ sơ Giáo viên sau khi đã đăng ký trên Supabase Auth
export const registerTeacherProfile = async (req, res) => {
  try {
    const { fullName, specializationIds } = req.body;
    
    // req.user được gán từ authMiddleware sau khi xác thực Token thành công
    const userId = req.user.id;
    const email = req.user.email;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên không được để trống'
      });
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Tạo hồ sơ giáo viên thất bại'
    });
  }
};

// Lấy thông tin hồ sơ của Giáo viên đang đăng nhập
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await authService.getMyProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hồ sơ. Vui lòng đăng ký hồ sơ trước.'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lấy thông tin hồ sơ thất bại'
    });
  }
};

// Đăng nhập tài khoản bằng email & password
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.signInTeacher(email, password);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    let msg = error.message;
    if (msg.includes('Invalid login credentials')) {
      msg = 'Email hoặc mật khẩu không chính xác';
    }
    return res.status(401).json({
      success: false,
      message: msg || 'Đăng nhập thất bại'
    });
  }
};

// ── Google OAuth ────────────────────────────────────────────────

/**
 * Bước 1: Tạo Google OAuth URL và redirect người dùng đến Google.
 * Domain hiển thị trên màn hình chọn tài khoản Google sẽ là FRONTEND_URL.
 */
export const googleAuth = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!clientId || !frontendUrl) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID hoặc FRONTEND_URL chưa được cấu hình'
      });
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể khởi tạo Google OAuth'
    });
  }
};

/**
 * Bước 2: FE gửi `code` nhận được từ Google lên đây để đổi lấy Supabase session.
 */
export const googleExchange = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu authorization code từ Google'
      });
    }

    const result = await authService.exchangeGoogleCode(code);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Không thể xác thực với Google'
    });
  }
};
