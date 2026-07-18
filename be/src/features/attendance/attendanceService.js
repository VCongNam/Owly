import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';

export const attendanceService = {
  getAttendancesBySession: async (sessionId, teacherId) => {
    // 1. Kiểm tra session có tồn tại và giáo viên có quyền truy cập không
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: true
      }
    });

    if (!session) {
      throw new AppError('Không tìm thấy buổi học', 404);
    }

    if (session.class.teacherId !== teacherId) {
      throw new AppError('Bạn không có quyền xem điểm danh của lớp này', 403);
    }

    // 2. Lấy danh sách học sinh enroll trong lớp
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId: session.classId,
        isActive: true
      },
      include: {
        student: true
      },
      orderBy: {
        student: {
          fullName: 'asc'
        }
      }
    });

    // 3. Lấy bản ghi attendance hiện tại của session
    const currentAttendances = await prisma.attendance.findMany({
      where: {
        sessionId: sessionId
      }
    });

    const attendanceMap = new Map();
    currentAttendances.forEach(att => {
      attendanceMap.set(att.studentId, att);
    });

    // 4. Map dữ liệu trả về cho frontend
    const result = enrollments.map(enrollment => {
      const studentId = enrollment.studentId;
      const attendance = attendanceMap.get(studentId);
      
      return {
        studentId: studentId,
        studentCode: enrollment.student.studentCode,
        fullName: enrollment.student.fullName,
        avatarUrl: enrollment.student.avatarUrl,
        status: attendance ? attendance.status : null,
        notes: attendance ? attendance.notes : ''
      };
    });

    return result;
  },

  upsertAttendances: async (sessionId, teacherId, attendances) => {
    // 1. Kiểm tra session và quyền
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true }
    });

    if (!session) {
      throw new AppError('Không tìm thấy buổi học', 404);
    }

    if (session.class.teacherId !== teacherId) {
      throw new AppError('Bạn không có quyền điểm danh lớp này', 403);
    }

    // 2. Thực hiện upsert bằng transaction
    const upsertPromises = attendances.map(att => {
      return prisma.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: sessionId,
            studentId: att.studentId
          }
        },
        update: {
          status: att.status,
          notes: att.notes
        },
        create: {
          sessionId: sessionId,
          studentId: att.studentId,
          status: att.status,
          notes: att.notes
        }
      });
    });

    await prisma.$transaction(upsertPromises);

    // 3. (Tuỳ chọn) Nếu có học sinh vắng, có thể update session status thành Completed nếu đây là lần đầu điểm danh
    if (session.status === 'Scheduled') {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'Completed' }
      });
    }

    return { message: 'Cập nhật điểm danh thành công' };
  }
};
