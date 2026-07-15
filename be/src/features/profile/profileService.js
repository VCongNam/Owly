import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';
import { getMyProfile as getAuthProfile } from '../auth/authService.js';

export const getProfile = async (userId) => {
  // Tái sử dụng hàm lấy profile từ authService hỗ trợ cả giáo viên và học sinh
  return await getAuthProfile(userId);
};

export const updateProfile = async (userId, data) => {
  const account = await prisma.account.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: true,
      studentProfile: true
    }
  });

  if (!account) throw new Error('Tài khoản không tồn tại');

  await prisma.$transaction(async (tx) => {
    if (account.teacherProfile) {
      const { 
        fullName, phone, bankName, bankAccountNo, bankAccountName,
        bankBin, bio, metadata, specializationIds 
      } = data;

      if (
        fullName || 
        bankName !== undefined || 
        bankAccountNo !== undefined || 
        bankAccountName !== undefined ||
        bankBin !== undefined ||
        bio !== undefined ||
        metadata !== undefined
      ) {
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (bankName !== undefined) updateData.bankName = bankName;
        if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo;
        if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName;
        if (bankBin !== undefined) updateData.bankBin = bankBin;
        if (bio !== undefined) updateData.bio = bio;
        if (metadata !== undefined) updateData.metadata = metadata;

        await tx.teacher.update({
          where: { id: userId },
          data: updateData
        });
      }

      if (phone !== undefined) {
        await tx.account.update({
          where: { id: userId },
          data: { phone }
        });
      }

      if (specializationIds !== undefined) {
        // Xóa tất cả môn học liên kết cũ
        await tx.teacherSubject.deleteMany({
          where: { teacherId: userId }
        });

        // Tạo các liên kết môn học mới
        if (specializationIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: specializationIds.map((subId) => ({
              teacherId: userId,
              subjectId: subId
            }))
          });
        }
      }
    } else if (account.studentProfile) {
      // Đối với Học sinh tự cập nhật hồ sơ
      const { fullName, phone, email, dateOfBirth, parentPhone } = data;

      if (email && email !== account.email) {
        // Kiểm tra email trùng
        const existing = await tx.account.findUnique({
          where: { email }
        });
        if (existing) {
          throw new Error('Email này đã được sử dụng bởi một tài khoản khác');
        }

        // Cập nhật email đăng nhập bên Supabase Auth
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          email
        });
        if (authError) {
          throw new Error(`Không thể cập nhật email xác thực: ${authError.message}`);
        }
      }

      await tx.account.update({
        where: { id: userId },
        data: {
          email: email || undefined,
          phone: phone !== undefined ? phone : undefined
        }
      });

      await tx.student.update({
        where: { id: userId },
        data: {
          fullName: fullName || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          parentPhone: parentPhone || undefined
        }
      });
    }
  });

  return await getProfile(userId);
};

export const uploadAvatar = async (userId, file) => {
  if (!file) throw new Error('Không tìm thấy file ảnh');

  // Đổi tên file để tránh trùng lặp
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`; // Lưu theo folder userId

  // Upload lên bucket 'Owly' của Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('Owly')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    throw new Error(`Upload lỗi: ${error.message}`);
  }

  // Lấy Public URL của ảnh vừa upload
  const { data: publicUrlData } = supabase
    .storage
    .from('Owly')
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  // Cập nhật đường dẫn avatarUrl vào Database
  await prisma.account.update({
    where: { id: userId },
    data: { avatarUrl }
  });

  return { avatarUrl };
};
