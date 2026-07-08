import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';
import { getMyProfile as getAuthProfile } from '../auth/authService.js';

export const getProfile = async (userId) => {
  // Tái sử dụng hàm lấy profile từ authService, 
  // nhưng cần thêm trường phone và avatarUrl từ bảng account
  const profile = await prisma.teacher.findUnique({
    where: { id: userId },
    include: {
      account: {
        select: {
          email: true,
          isActive: true,
          packageType: true,
          packageExpiresAt: true,
          phone: true,
          avatarUrl: true,
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

  return {
    id: profile.id,
    teacherCode: profile.teacherCode,
    fullName: profile.fullName,
    bankName: profile.bankName,
    bankAccountNo: profile.bankAccountNo,
    bankAccountName: profile.bankAccountName,
    bankBin: profile.bankBin,
    bio: profile.bio,
    metadata: profile.metadata,
    account: profile.account,
    specializations: profile.specializations.map((s) => s.subject)
  };
};

export const updateProfile = async (userId, data) => {
  const { 
    fullName, phone, bankName, bankAccountNo, bankAccountName,
    bankBin, bio, metadata, specializationIds 
  } = data;

  return await prisma.$transaction(async (tx) => {
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

    return getProfile(userId);
  });
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
