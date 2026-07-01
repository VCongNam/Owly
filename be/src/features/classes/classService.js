import { prisma } from '../../config/db.js';

// Hàm tự động sinh mã lớp (Ví dụ: LHP001, LHP002...)
const generateClassCode = async (tx) => {
  const lastClass = await tx.class.findFirst({
    orderBy: { classCode: 'desc' }
  });
  
  let nextNum = 1;
  if (lastClass && lastClass.classCode.startsWith('LHP')) {
    const lastNum = parseInt(lastClass.classCode.replace('LHP', ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  
  return `LHP${String(nextNum).padStart(3, '0')}`;
};

export const createClass = async (teacherId, data) => {
  return await prisma.$transaction(async (tx) => {
    const classCode = await generateClassCode(tx);
    
    return await tx.class.create({
      data: {
        classCode: classCode,
        name: data.name,
        teacherId: teacherId,
        startDate: new Date(data.startDate),
        status: data.status || 'Active',
      }
    });
  });
};

export const getClasses = async (teacherId) => {
  return await prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' }
  });
};

export const getClassById = async (id, teacherId) => {
  const classObj = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          fullName: true,
          teacherCode: true
        }
      }
    }
  });

  if (!classObj) return null;
  
  // Bảo mật: Đảm bảo giáo viên chỉ xem được lớp của chính mình 
  // (hoặc nếu là Admin thì bỏ qua logic này, hiện tại Owly xét theo teacherId)
  if (classObj.teacherId !== teacherId) {
    throw new Error('Bạn không có quyền truy cập lớp học này');
  }

  return classObj;
};

export const updateClass = async (id, teacherId, data) => {
  // Kiểm tra quyền sở hữu trước khi cập nhật
  const existingClass = await getClassById(id, teacherId);
  if (!existingClass) return null;

  return await prisma.class.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      status: data.status !== undefined ? data.status : undefined,
    }
  });
};

export const deleteClass = async (id, teacherId) => {
  // Kiểm tra quyền sở hữu trước khi xóa
  const existingClass = await getClassById(id, teacherId);
  if (!existingClass) return null;

  return await prisma.class.delete({
    where: { id }
  });
};
