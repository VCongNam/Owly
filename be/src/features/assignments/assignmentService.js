import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { getOrCreateDefaultGradeCategory } from '../gradeCategories/gradeCategoryService.js';

export const createAssignment = async (data) => {
  if (!data.gradeCategoryId) {
    const categories = await getOrCreateDefaultGradeCategory(data.classId);
    data.gradeCategoryId = categories[0].id;
  }

  return prisma.assignment.create({
    data
  });
};

export const getAssignmentsByClassId = async (classId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    prisma.assignment.findMany({
      where: { classId },
      include: {
        category: true
      },
      orderBy: {
        dueDate: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.assignment.count({
      where: { classId }
    })
  ]);

  return {
    items,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit
    }
  };
};

export const updateAssignment = async (id, data) => {
  return prisma.assignment.update({
    where: { id },
    data
  });
};

export const deleteAssignment = async (id) => {
  return prisma.assignment.delete({
    where: { id }
  });
};

export const getTeacherUpcomingAssignments = async (teacherId, limit = 5) => {
  return await prisma.assignment.findMany({
    where: {
      class: {
        teacherId: teacherId
      },
      dueDate: {
        gte: new Date()
      }
    },
    include: {
      class: true
    },
    orderBy: {
      dueDate: 'asc'
    },
    take: limit
  });
};

export const submitAssignment = async (assignmentId, studentId, content) => {
  // Lấy thông tin bài tập để kiểm tra quyền và hạn nộp
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, classId: true, dueDate: true, title: true }
  });
  if (!assignment) {
    throw new AppError('Bài tập không tồn tại', 404);
  }

  // Guard 1: Kiểm tra học sinh có phải thành viên active của lớp chứa bài tập không
  const enrollment = await prisma.classEnrollment.findFirst({
    where: { classId: assignment.classId, studentId, isActive: true }
  });
  if (!enrollment) {
    throw new AppError('Bạn không phải thành viên của lớp học này', 403);
  }

  // Guard 2: Kiểm tra hạn nộp bài
  if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    throw new AppError('Bài tập đã hết hạn nộp', 400);
  }

  const existing = await prisma.submission.findFirst({
    where: { assignmentId, studentId },
    include: { feedback: true }
  });

  if (existing) {
    if (existing.feedback) {
      throw new AppError('Bài làm đã được chấm điểm, không thể nộp lại', 400);
    }

    return await prisma.submission.update({
      where: { id: existing.id },
      data: { content, submittedAt: new Date() }
    });
  }

  return await prisma.submission.create({
    data: { assignmentId, studentId, content }
  });
};

export const getMySubmission = async (assignmentId, studentId) => {
  return await prisma.submission.findFirst({
    where: { assignmentId, studentId },
    include: {
      feedback: true
    }
  });
};

export const getAssignmentSubmissions = async (assignmentId, teacherId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: true }
  });
  if (!assignment) throw new AppError('Bài tập không tồn tại', 404);
  if (assignment.class.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền xem bài nộp của bài tập này', 403);
  }

  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId: assignment.classId, isActive: true },
    include: {
      student: {
        include: {
          submissions: {
            where: { assignmentId },
            include: { feedback: true }
          }
        }
      }
    },
    orderBy: {
      student: {
        fullName: 'asc'
      }
    }
  });

  return enrollments.map(e => {
    const student = e.student;
    const submission = student.submissions[0] || null;
    return {
      studentId: student.id,
      fullName: student.fullName,
      studentCode: student.studentCode,
      submission: submission ? {
        id: submission.id,
        content: submission.content,
        submittedAt: submission.submittedAt,
        feedback: submission.feedback ? {
          id: submission.feedback.id,
          grade: submission.feedback.grade,
          remarks: submission.feedback.remarks,
          attachmentUrl: submission.feedback.attachmentUrl
        } : null
      } : null
    };
  });
};

export const gradeSubmission = async (submissionId, teacherId, { grade, remarks, attachmentUrl }) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { class: true }
      }
    }
  });
  if (!submission) throw new AppError('Bài làm không tồn tại', 404);
  if (submission.assignment.class.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền chấm bài làm này', 403);
  }

  return await prisma.submissionFeedback.upsert({
    where: { submissionId },
    update: { grade, remarks, attachmentUrl, gradedById: teacherId },
    create: { submissionId, grade, remarks, attachmentUrl, gradedById: teacherId }
  });
};
