// be/src/services/authService.js
import { prisma } from '../config/db.js';
import { supabase } from '../config/supabase.js';

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
      specializations: savedTeacher.specializations.map(s => s.subject)
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
    session: data.session
  };
};
