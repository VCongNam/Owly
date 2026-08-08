import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { assertClassAccess } from '../../utils/authHelpers.js';

/**
 * Lấy danh sách nhận xét buổi học (Left join tất cả học sinh đang ghi danh)
 */
export const getSessionFeedbacks = async (sessionId, teacherId) => {
  // 1. Kiểm tra buổi học có tồn tại không
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          id: true,
          teacherId: true,
          name: true,
          classCode: true
        }
      }
    }
  });

  if (!session) {
    throw new AppError('Buổi học không tồn tại', 404);
  }

  // 2. Xác thực quyền giáo viên phụ trách lớp học
  await assertClassAccess(teacherId, 'teacher', session.class.id);

  // 3. Lấy tất cả học sinh ghi danh trong lớp này
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId: session.class.id },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          studentCode: true
        }
      }
    },
    orderBy: {
      student: {
        fullName: 'asc'
      }
    }
  });

  // 4. Lấy các nhận xét buổi học đã lưu trong db
  const savedFeedbacks = await prisma.sessionFeedback.findMany({
    where: { sessionId }
  });

  const feedbackMap = new Map();
  savedFeedbacks.forEach(f => feedbackMap.set(f.studentId, f));

  // 5. Build danh sách đầy đủ (Left Join)
  const items = enrollments.map(enr => {
    const student = enr.student;
    const fb = feedbackMap.get(student.id);

    return {
      studentId: student.id,
      fullName: student.fullName,
      studentCode: student.studentCode,
      feedbackId: fb ? fb.id : null,
      academicComment: fb ? fb.academicComment : '',
      attitudeComment: fb ? fb.attitudeComment : '',
      homeworkComment: fb ? fb.homeworkComment : '',
      updatedAt: fb ? fb.updatedAt : null
    };
  });

  return {
    session: {
      id: session.id,
      title: session.title,
      date: session.date,
      classId: session.class.id,
      className: session.class.name,
      classCode: session.class.classCode
    },
    feedbacks: items
  };
};

/**
 * Lưu/Cập nhật hàng loạt nhận xét của buổi học
 */
export const upsertSessionFeedbacks = async (sessionId, teacherId, feedbacks) => {
  // 1. Kiểm tra buổi học và xác thực giáo viên
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          id: true,
          teacherId: true
        }
      }
    }
  });

  if (!session) {
    throw new AppError('Buổi học không tồn tại', 404);
  }

  await assertClassAccess(teacherId, 'teacher', session.class.id);

  // 2. Chạy transaction để lưu hàng loạt
  return await prisma.$transaction(async (tx) => {
    const results = [];

    for (const fb of feedbacks) {
      const { studentId, academicComment, attitudeComment, homeworkComment } = fb;

      // Xác thực xem học sinh có trong lớp không
      const enrollment = await tx.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: session.class.id,
            studentId
          }
        }
      });

      if (!enrollment) {
        throw new AppError(`Học sinh với ID ${studentId} không thuộc lớp học này`, 400);
      }

      // Thực hiện upsert
      const upserted = await tx.sessionFeedback.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId
          }
        },
        update: {
          academicComment: academicComment || null,
          attitudeComment: attitudeComment || null,
          homeworkComment: homeworkComment || null,
          teacherId
        },
        create: {
          sessionId,
          studentId,
          teacherId,
          academicComment: academicComment || null,
          attitudeComment: attitudeComment || null,
          homeworkComment: homeworkComment || null
        }
      });

      results.push(upserted);
    }

    return results;
  });
};
