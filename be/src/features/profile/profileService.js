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
    account: profile.account,
    specializations: profile.specializations.map((s) => s.subject)
  };
};

export const updateProfile = async (userId, data) => {
  const { fullName, phone } = data;

  return await prisma.$transaction(async (tx) => {
    let updatedTeacher = null;
    if (fullName) {
      updatedTeacher = await tx.teacher.update({
        where: { id: userId },
        data: { fullName }
      });
    }

    if (phone !== undefined) {
      await tx.account.update({
        where: { id: userId },
        data: { phone }
      });
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
