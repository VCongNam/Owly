import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';

// Helper: Quy đổi ngày trong tuần của JavaScript sang chuẩn Prisma (2 = Thứ 2, 8 = Chủ nhật)
const getPrismaDayOfWeek = (jsDay) => {
  return jsDay === 0 ? 8 : jsDay + 1;
};

// Helper: Định dạng ngày thành YYYY-MM-DD
const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Lấy lịch dạy cá nhân của Giáo viên
 */
export const getPersonalSchedule = async (teacherId, startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Ngày bắt đầu hoặc ngày kết thúc không hợp lệ', 400);
  }

  // Lấy các buổi học thuộc các lớp của giáo viên này phụ trách
  const sessions = await prisma.session.findMany({
    where: {
      class: {
        teacherId: teacherId
      },
      date: {
        gte: start,
        lte: end
      }
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
          status: true
        }
      },
      attendances: {
        select: {
          id: true,
          status: true
        }
      },
      feedbacks: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return sessions.map(session => ({
    id: session.id,
    classId: session.classId,
    className: session.class.name,
    classCode: session.class.classCode,
    title: session.title || 'Buổi học',
    date: session.date,
    status: session.status,
    hasAttendance: session.attendances.length > 0,
    hasFeedback: session.feedbacks.length > 0
  }));
};

/**
 * Lấy danh sách toàn bộ các buổi học của một lớp cụ thể
 */
export const getClassSessions = async (classId, userId, userRole, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const targetClass = await prisma.class.findUnique({
    where: { id: classId }
  });

  if (!targetClass) {
    throw new AppError('Lớp học không tồn tại', 404);
  }

  if (userRole === 'student') {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId, studentId: userId, isActive: true }
    });
    if (!enrollment) {
      throw new AppError('Bạn không tham gia lớp học này', 403);
    }
  } else {
    if (targetClass.teacherId !== userId) {
      throw new AppError('Bạn không có quyền quản lý lịch học lớp này', 403);
    }
  }

  const totalItems = await prisma.session.count({
    where: { classId }
  });

  const sessions = await prisma.session.findMany({
    where: { classId },
    include: {
      attendances: userRole === 'student' ? {
        where: { studentId: userId },
        select: {
          id: true,
          status: true,
          notes: true
        }
      } : {
        select: {
          id: true
        }
      },
      feedbacks: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    },
    skip,
    take: limit
  });

  const formattedSessions = sessions.map(session => ({
    id: session.id,
    title: session.title,
    date: session.date,
    status: session.status,
    hasAttendance: session.attendances.length > 0,
    hasFeedback: session.feedbacks.length > 0,
    attendance: userRole === 'student' && session.attendances.length > 0 ? {
      status: session.attendances[0].status,
      notes: session.attendances[0].notes
    } : null
  }));

  return {
    items: formattedSessions,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit
    }
  };
};

/**
 * Cấu hình lịch học định kỳ và tự động sinh các buổi học
 */
export const setupRecurringSchedule = async (classId, teacherId, schedules, generationRange) => {
  const targetClass = await prisma.class.findUnique({
    where: { id: classId }
  });

  if (!targetClass) {
    throw new AppError('Lớp học không tồn tại', 404);
  }

  if (targetClass.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền quản lý lịch học lớp này', 403);
  }

  const genStart = new Date(generationRange.startDate);
  const genEnd = new Date(generationRange.endDate);

  if (isNaN(genStart.getTime()) || isNaN(genEnd.getTime())) {
    throw new AppError('Khoảng thời gian sinh lịch học không hợp lệ', 400);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật các bản ghi ClassSchedule mẫu
    await tx.classSchedule.deleteMany({
      where: { classId }
    });

    if (schedules && schedules.length > 0) {
      await tx.classSchedule.createMany({
        data: schedules.map(sch => ({
          classId,
          dayOfWeek: sch.dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
          room: sch.room || ''
        }))
      });
    }

    // 2. Xóa các buổi học trạng thái 'Scheduled' trong tương lai của lớp này
    // Chỉ xóa các buổi CHƯA điểm danh và CHƯA nhận xét
    const now = new Date();
    await tx.session.deleteMany({
      where: {
        classId,
        status: 'Scheduled',
        date: { gte: now },
        attendances: { none: {} },
        feedbacks: { none: {} }
      }
    });

    // Lấy danh sách các buổi học còn lại của lớp học này (để tránh tạo trùng lặp)
    const existingSessions = await tx.session.findMany({
      where: { classId }
    });
    const existingTimestamps = new Set(existingSessions.map(s => s.date.getTime()));

    // 3. Tiến hành duyệt qua từng ngày trong khoảng range để sinh các buổi học tương ứng
    const sessionsToCreate = [];
    const currentLoopDate = new Date(genStart);

    while (currentLoopDate <= genEnd) {
      const jsDay = currentLoopDate.getDay();
      const prismaDay = getPrismaDayOfWeek(jsDay);

      // Tìm xem có lịch học cố định nào trùng ngày thứ này không
      const matchedSchedules = schedules.filter(sch => sch.dayOfWeek === prismaDay);

      for (const sch of matchedSchedules) {
        // Tạo chuỗi ngày giờ theo múi giờ Việt Nam (UTC+7)
        const dateStr = formatDateString(currentLoopDate);
        const sessionDate = new Date(`${dateStr}T${sch.startTime}:00+07:00`);

        // Đảm bảo buổi học sinh ra nằm trong đúng khoảng range và không trùng buổi đã có
        if (sessionDate >= genStart && sessionDate <= genEnd && !existingTimestamps.has(sessionDate.getTime())) {
          sessionsToCreate.push({
            classId,
            title: `Buổi học`,
            date: sessionDate,
            status: 'Scheduled'
          });
        }
      }

      // Tăng thêm 1 ngày
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    // 4. Lưu hàng loạt vào DB
    if (sessionsToCreate.length > 0) {
      await tx.session.createMany({
        data: sessionsToCreate
      });
    }

    // Lấy lại danh sách schedules mới cập nhật
    const updatedSchedules = await tx.classSchedule.findMany({
      where: { classId }
    });

    return {
      schedules: updatedSchedules,
      createdSessionsCount: sessionsToCreate.length
    };
  });
};

/**
 * Tạo thủ công một buổi học lẻ / buổi học bù
 */
export const createManualSession = async (classId, teacherId, data) => {
  const targetClass = await prisma.class.findUnique({
    where: { id: classId }
  });

  if (!targetClass) {
    throw new AppError('Lớp học không tồn tại', 404);
  }

  if (targetClass.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền quản lý lịch học lớp này', 403);
  }

  const sessionDate = new Date(data.date);
  if (isNaN(sessionDate.getTime())) {
    throw new AppError('Thời gian buổi học không hợp lệ', 400);
  }

  // Tạo buổi học
  return await prisma.session.create({
    data: {
      classId,
      title: data.title || 'Buổi học bù',
      date: sessionDate,
      status: 'Scheduled'
    }
  });
};

/**
 * Cập nhật thông tin hoặc hủy một buổi học
 */
export const updateSession = async (sessionId, teacherId, data) => {
  const targetSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          teacherId: true
        }
      }
    }
  });

  if (!targetSession) {
    throw new AppError('Buổi học không tồn tại', 404);
  }

  if (targetSession.class.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền quản lý buổi học này', 403);
  }

  const updateData = {};
  
  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.date !== undefined) {
    const newDate = new Date(data.date);
    if (isNaN(newDate.getTime())) {
      throw new AppError('Thời gian buổi học không hợp lệ', 400);
    }
    updateData.date = newDate;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return await prisma.session.update({
    where: { id: sessionId },
    data: updateData
  });
};
