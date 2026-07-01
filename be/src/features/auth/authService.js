import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';

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
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to retrieve user from authentication provider');
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
      token: authData.session?.access_token
    };
  });
};

export const createTeacherProfile = async (userData) => {
  const { userId, email, fullName, specializationIds } = userData;

  const existingAccount = await prisma.account.findUnique({
    where: { id: userId }
  });

  if (existingAccount) {
    throw new Error('Tài khoản đã tồn tại');
  }

  return await prisma.$transaction(async (tx) => {
    // Tự động sinh mã giáo viên
    const teacherCode = await generateTeacherCode(tx);

    const account = await tx.account.create({
      data: {
        id: userId,
        email: email,
        passwordHash: 'EXTERNAL_SUPABASE_AUTH',
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

    return { account, teacher };
  });
};

export const getMyProfile = async (userId) => {
  const profile = await prisma.teacher.findUnique({
    where: { id: userId },
    include: {
      account: {
        select: {
          email: true,
          isActive: true,
          createdAt: true
        }
      },
      specializations: {
        include: {
          subject: true
        }
      }
    }
  });

  if (!profile) return null;

  // Format lại cấu trúc trả về cho gọn gàng (phẳng hóa danh sách chuyên môn)
  return {
    id: profile.id,
    teacherCode: profile.teacherCode,
    fullName: profile.fullName,
    account: profile.account,
    specializations: profile.specializations.map((s) => s.subject)
  };
};

export const signInTeacher = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: data.user,
    token: data.session?.access_token
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
    throw new Error(`Google token exchange thất bại: ${googleTokens.error_description || googleTokens.error}`);
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
    throw new Error(
      supabaseData.message || supabaseData.error_description || 'Supabase không thể xác thực Google token'
    );
  }

  const { user, access_token } = supabaseData;

  // 3. Tự động tạo hồ sơ giáo viên nếu là lần đăng nhập đầu tiên
  await ensureTeacherProfile(user);

  return {
    user,
    token: access_token,
  };
};

/**
 * Kiểm tra và tạo hồ sơ giáo viên cho user Google (nếu chưa tồn tại).
 */
const ensureTeacherProfile = async (user) => {
  const existing = await prisma.account.findUnique({
    where: { id: user.id }
  });

  if (!existing) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split('@')[0];

    await createTeacherProfile({
      userId: user.id,
      email: user.email,
      fullName,
      specializationIds: [],
    });
  }
};

export const signOutTeacher = async (token) => {
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) {
    throw new Error(error.message);
  }
  return true;
};

export const changeTeacherPassword = async (userId, newPassword) => {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const forgotTeacherPassword = async (email, redirectTo) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

