// be/src/utils/authHelpers.js
// Helper kiểm tra quyền truy cập lớp học dùng chung cho tất cả phân hệ
// (Assignments, Posts, Materials, Sessions, Tuition, Members, v.v.)
import { prisma } from '../config/db.js';
import { AppError } from './appError.js';

/**
 * Kiểm tra quyền truy cập lớp học.
 * - Teacher: phải là chủ lớp (class.teacherId === userId).
 * - Student: phải có bản ghi ClassEnrollment đang hoạt động (isActive: true).
 * - Ném 404 nếu lớp không tồn tại.
 * - Ném 403 nếu không có quyền.
 *
 * @param {string} userId - ID của người dùng hiện tại
 * @param {string} userRole - Role: 'teacher' | 'student'
 * @param {string} classId - ID của lớp học cần kiểm tra
 * @returns {Promise<object>} classRecord nếu hợp lệ
 */
export const assertClassAccess = async (userId, userRole, classId) => {
  const classRecord = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true, name: true, classCode: true }
  });

  if (!classRecord) {
    throw new AppError('Lớp học không tồn tại', 404);
  }

  if (userRole === 'teacher') {
    if (classRecord.teacherId !== userId) {
      throw new AppError('Bạn không có quyền truy cập lớp học này', 403);
    }
  } else if (userRole === 'student') {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId, studentId: userId, isActive: true }
    });
    if (!enrollment) {
      throw new AppError('Bạn không phải thành viên của lớp học này', 403);
    }
  } else {
    // Role không xác định (admin sẽ xử lý riêng khi có phân hệ admin)
    throw new AppError('Vai trò không hợp lệ để truy cập lớp học', 403);
  }

  return classRecord;
};

/**
 * Yêu cầu người dùng phải có role teacher.
 * @param {object} req - Express request object
 * @throws {AppError} 403 nếu không phải teacher
 */
export const requireTeacher = (req) => {
  if (req.user?.role !== 'teacher') {
    throw new AppError('Chỉ giáo viên mới có quyền thực hiện thao tác này', 403);
  }
};

/**
 * Yêu cầu người dùng phải có role student.
 * @param {object} req - Express request object
 * @throws {AppError} 403 nếu không phải student
 */
export const requireStudent = (req) => {
  if (req.user?.role !== 'student') {
    throw new AppError('Chỉ học sinh mới có quyền thực hiện thao tác này', 403);
  }
};
