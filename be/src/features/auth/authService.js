import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/appError.js';

// Hàm helper để sinh mã giáo viên tự động (ví dụ: GV001, GV002...)
const generateTeacherCode = async (tx) => {
  const lastTeacher = await tx.teacher.findFirst({
    orderBy: { teacherCode: 'desc' }
  });
  
  let nextNum = 1;
  if (lastTeacher && lastTeacher.teacherCode.startsWith('GV')) {
    const lastNum = parseInt(lastTeacher.teacherCode.replace('GV', ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  
  return `GV${String(nextNum).padStart(3, '0')}`;
};

// Đăng ký tài khoản trên Supabase Auth + Tạo Profile trong DB cục bộ
export const signUpTeacher = async (email, password, fullName, phone, specializationIds) => {
  // 1. Gọi Supabase Auth để tạo tài khoản email/password
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone
      }
    }
  });

  if (authError) {
    throw new AppError(authError.message, 400);
  }

  if (!authData.user) {
    throw new AppError('Failed to retrieve user from authentication provider', 500);
  }

  const userId = authData.user.id;

  // 2. Lưu thông tin vào DB thông qua Prisma
  return await prisma.$transaction(async (tx) => {
    // Tự động sinh mã giáo viên
    const teacherCode = await generateTeacherCode(tx);

    const account = await tx.account.create({
      data: {
        id: userId,
        email: email,
        passwordHash: 'EXTERNAL_SUPABASE_AUTH', // Mật khẩu thực tế do Supabase Auth quản lý
        isActive: true
      }
    });

    const teacher = await tx.teacher.create({
      data: {
        id: userId,
        fullName: fullName,
        teacherCode: teacherCode
      }
    });

    // Tạo liên kết với các môn học chuyên môn
    if (specializationIds && specializationIds.length > 0) {
      await tx.teacherSubject.createMany({
        data: specializationIds.map((subId) => ({
          teacherId: userId,
          subjectId: subId
        }))
      });
    }

    // Lấy lại thông tin hoàn chỉnh để trả về
    const savedTeacher = await tx.teacher.findUnique({
      where: { id: userId },
      include: {
        specializations: {
          include: {
            subject: true
          }
        }
      }
    });

    return {
      userId: userId,
      email: email,
      fullName: savedTeacher.fullName,
      teacherCode: savedTeacher.teacherCode,
      phone: phone,
      specializations: savedTeacher.specializations.map(s => s.subject),
      token: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token,
      expiresAt: authData.session?.expires_at
    };
  });
};

export const createTeacherProfile = async (userData) => {
  const { userId, email, fullName, avatarUrl, phone, specializationIds } = userData;

  const existingAccount = await prisma.account.findUnique({
    where: { id: userId }
  });

  if (existingAccount) {
    throw new AppError('Tài khoản đã tồn tại', 409);
  }

  return await prisma.$transaction(async (tx) => {
    // Tự động sinh mã giáo viên
    const teacherCode = await generateTeacherCode(tx);

    const account = await tx.account.create({
      data: {
        id: userId,
        email: email,
        passwordHash: 'EXTERNAL_SUPABASE_AUTH',
        isActive: true,
        avatarUrl: avatarUrl || null,
        phone: phone || null
      }
    });

    const teacher = await tx.teacher.create({
      data: {
        id: userId,
        fullName: fullName,
        teacherCode: teacherCode
      }
    });

    // Tạo liên kết với các môn học chuyên môn
    if (specializationIds && specializationIds.length > 0) {
      await tx.teacherSubject.createMany({
        data: specializationIds.map((subId) => ({
          teacherId: userId,
          subjectId: subId
        }))
      });
    }

    return { account, teacher };
  });
};

export const getMyProfile = async (userId) => {
  const account = await prisma.account.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: {
        include: {
          specializations: {
            include: {
              subject: true
            }
          }
        }
      },
      studentProfile: {
        include: {
          createdBy: {
            select: {
              fullName: true
            }
          }
        }
      },
      adminProfile: true
    }
  });

  if (!account) return null;

  if (account.teacherProfile) {
    return {
      id: account.id,
      role: 'teacher',
      email: account.email,
      isActive: account.isActive,
      packageType: account.packageType,
      phone: account.phone,
      avatarUrl: account.avatarUrl,
      fullName: account.teacherProfile.fullName,
      teacherCode: account.teacherProfile.teacherCode,
      bankName: account.teacherProfile.bankName,
      bankAccountNo: account.teacherProfile.bankAccountNo,
      bankAccountName: account.teacherProfile.bankAccountName,
      bankBin: account.teacherProfile.bankBin,
      bio: account.teacherProfile.bio,
      specializations: account.teacherProfile.specializations.map(s => s.subject)
    };
  }

  if (account.studentProfile) {
    return {
      id: account.id,
      role: 'student',
      email: account.email,
      isActive: account.isActive,
      phone: account.phone,
      avatarUrl: account.avatarUrl,
      fullName: account.studentProfile.fullName,
      studentCode: account.studentProfile.studentCode,
      dateOfBirth: account.studentProfile.dateOfBirth,
      parentPhone: account.studentProfile.parentPhone,
      createdById: account.studentProfile.createdById,
      createdByTeacherName: account.studentProfile.createdBy?.fullName
    };
  }

  if (account.adminProfile) {
    return {
      id: account.id,
      role: 'admin',
      email: account.email,
      isActive: account.isActive,
      fullName: account.adminProfile.fullName
    };
  }

  return {
    id: account.id,
    role: 'unknown',
    email: account.email,
    isActive: account.isActive,
    avatarUrl: account.avatarUrl,
    phone: account.phone
  };
};

export const signInUser = async (email, password, role) => {
  let resolvedEmail = email;

  // Nếu vai trò là học sinh hoặc thông tin đăng nhập không chứa ký tự '@'
  if (role === 'student' || !email.includes('@')) {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { studentCode: { equals: email, mode: 'insensitive' } },
          { account: { email: { equals: email, mode: 'insensitive' } } }
        ]
      },
      include: {
        account: true
      }
    });

    if (student && student.account) {
      resolvedEmail = student.account.email;
    } else if (role === 'student') {
      throw new AppError('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password
  });

  if (error) {
    // Chuyển đổi thông báo lỗi của Supabase sang Tiếng Việt thân thiện
    let userFriendlyMessage = error.message;
    if (error.message.includes('Invalid login credentials')) {
      userFriendlyMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác';
    }
    throw new AppError(userFriendlyMessage, 401);
  }

  const profile = await getMyProfile(data.user.id);

  if (!profile) {
    throw new AppError('Tài khoản chưa được tạo hồ sơ', 404);
  }

  if (role && profile.role !== role) {
    throw new AppError(`Tài khoản này không đăng ký vai trò ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'}`, 403);
  }

  return {
    user: {
      ...data.user,
      ...profile
    },
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    expiresAt: data.session?.expires_at
  };
};

// ── Google OAuth ────────────────────────────────────────────────

/**
 * Đổi Google authorization code → Google tokens → Supabase session.
 * Middleware hiện tại (supabase.auth.getUser) vẫn hoạt động bình thường.
 */
export const exchangeGoogleCode = async (code) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // 1. Đổi `code` lấy Google tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${frontendUrl}/auth/callback`,
      grant_type: 'authorization_code',
    }).toString(),
  });

  const googleTokens = await tokenRes.json();
  if (googleTokens.error) {
    throw new AppError(`Google token exchange thất bại: ${googleTokens.error_description || googleTokens.error}`, 401);
  }

  // 2. Đổi Google ID token → Supabase session (không qua Supabase OAuth callback)
  const supabaseRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=id_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        provider: 'google',
        id_token: googleTokens.id_token,
        access_token: googleTokens.access_token,
      }),
    }
  );

  const supabaseData = await supabaseRes.json();
  if (supabaseData.error || supabaseData.error_code) {
    throw new AppError(
      supabaseData.message || supabaseData.error_description || 'Supabase không thể xác thực Google token',
      401
    );
  }

  const { user, access_token } = supabaseData;

  // 3. Tự động tạo hồ sơ giáo viên nếu là lần đăng nhập đầu tiên
  await ensureTeacherProfile(user);

  const profile = await getMyProfile(user.id);

  return {
    user: {
      ...user,
      ...(profile || {})
    },
    token: access_token,
  };
};

/**
 * Kiểm tra và tạo/cập nhật hồ sơ giáo viên cho user Google/Facebook (nếu chưa tồn tại).
 */
export const ensureTeacherProfile = async (user) => {
  const existing = await prisma.account.findUnique({
    where: { id: user.id }
  });

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  if (!existing) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split('@')[0];

    await createTeacherProfile({
      userId: user.id,
      email: user.email,
      fullName,
      avatarUrl,
      phone: user.user_metadata?.phone || null,
      specializationIds: [],
    });
  } else if (avatarUrl && !existing.avatarUrl) {
    // Nếu đã có tài khoản cục bộ nhưng chưa có avatarUrl, tự động đồng bộ từ OAuth mới
    await prisma.account.update({
      where: { id: user.id },
      data: { avatarUrl }
    });
  }
};

export const refreshSession = async (refreshToken) => {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    throw new AppError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
  }

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at
  };
};

export const signOutTeacher = async (token) => {
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) {
    throw new AppError(error.message, 500);
  }
  return true;
};

export const changeTeacherPassword = async (userId, newPassword) => {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  });
  if (error) {
    throw new AppError(error.message, 500);
  }
  return data;
};

export const forgotTeacherPassword = async (email, redirectTo) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
  if (error) {
    throw new AppError(error.message, 500);
  }
  return data;
};

