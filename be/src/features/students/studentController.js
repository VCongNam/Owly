import * as studentService from './studentService.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';
import { assertClassAccess } from '../../utils/authHelpers.js';
import { AppError } from '../../utils/appError.js';

// Format helper cho ngày sinh và ngày tạo
const formatStudentDates = (student) => {
  if (!student) return null;
  return {
    ...student,
    dateOfBirth: student.dateOfBirth ? formatToVietnamTime(student.dateOfBirth).split(' ')[0] : null, // Chỉ lấy YYYY-MM-DD
    createdAt: student.createdAt ? formatToVietnamTime(student.createdAt) : null
  };
};

// Lấy danh sách học viên của giáo viên (đã phân trang)
export const getStudents = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { page, limit, search, classId } = req.query;

    const result = await studentService.getStudentsOfTeacherClasses(teacherId, {
      page,
      limit,
      search,
      classId
    });

    const formattedItems = result.items.map(student => formatStudentDates(student));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin chi tiết một học sinh
export const getStudentById = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    const student = await studentService.getStudentById(id, teacherId);
    if (!student) {
      return next(new AppError('Không tìm thấy thông tin học viên', 404));
    }

    return res.status(200).json({
      success: true,
      data: formatStudentDates(student)
    });
  } catch (error) {
    next(error);
  }
};

// Giáo viên tìm kiếm học viên trên toàn hệ thống để thêm vào lớp
export const searchDirectory = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { q } = req.query;

    const students = await studentService.searchStudentsInDirectory(teacherId, q);
    const formatted = students.map(s => formatStudentDates(s));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Học sinh tự cập nhật thông tin cá nhân của mình
export const updateSelfProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const data = req.body;

    // Chỉ cho phép học sinh cập nhật thông tin của chính mình (req.user từ authMiddleware)
    const updated = await studentService.studentUpdateOwnProfile(studentId, data);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: formatStudentDates(updated)
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách thành viên trong lớp học
export const getClassMembers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { classId } = req.params;
    const { page, limit, search } = req.query;

    // Xác thực quyền truy cập lớp học của người dùng hiện tại
    await assertClassAccess(userId, userRole, classId);

    if (userRole === 'student') {
      const result = await studentService.getClassMembersForStudent(classId, userId, {
        page: page || 1,
        limit: limit || 100,
        search
      });
      return res.status(200).json({
        success: true,
        data: result
      });
    }

    // Đối với Giáo viên: Giữ nguyên logic cũ
    const result = await studentService.getStudentsOfTeacherClasses(userId, {
      classId,
      page: page || 1,
      limit: limit || 100, // Lấy toàn bộ thành viên lớp hoặc phân trang tùy chọn
      search
    });

    const formattedItems = result.items.map(s => formatStudentDates(s));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

// Giáo viên ghi danh học sinh đã có sẵn vào lớp
export const enrollExistingStudent = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;
    const { studentId } = req.body;

    const enrollment = await studentService.enrollExistingStudent(classId, studentId, teacherId);

    return res.status(200).json({
      success: true,
      message: 'Ghi danh học viên vào lớp học thành công',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Giáo viên tạo mới học sinh và ghi danh vào lớp
export const createAndEnrollStudent = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;
    const data = req.body;

    const newStudent = await studentService.createAndEnrollStudent(classId, teacherId, data);

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản và ghi danh học viên thành công',
      data: formatStudentDates(newStudent)
    });
  } catch (error) {
    next(error);
  }
};

// Giáo viên tạo mới hàng loạt học sinh và ghi danh vào lớp
export const bulkImportStudents = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;
    const { students } = req.body;

    const newStudents = await studentService.bulkCreateAndEnrollStudents(classId, teacherId, students);
    const formatted = newStudents.map(student => formatStudentDates(student));

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản và ghi danh thành công ${newStudents.length} học viên`,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Giáo viên hủy liên kết (Unenroll) học sinh khỏi lớp
export const unenrollStudent = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classId, studentId } = req.params;

    await studentService.unenrollStudentFromClass(classId, studentId, teacherId);

    return res.status(200).json({
      success: true,
      message: 'Hủy ghi danh học viên khỏi lớp học thành công'
    });
  } catch (error) {
    next(error);
  }
};

// UC-35: Giáo viên xem nhật ký điểm danh tổng hợp của một học sinh trong lớp
export const getStudentAttendanceLog = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { classId, studentId } = req.params;

    const log = await studentService.getStudentAttendanceLog(classId, studentId, teacherId);

    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// Học sinh xem danh sách lớp của chính mình
export const getMyClasses = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const classes = await studentService.getMyClasses(studentId);

    return res.status(200).json({
      success: true,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

// Học sinh xem lịch học tổng hợp của chính mình
export const getMySchedule = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { startDate, endDate, classId } = req.query;

    const sessions = await studentService.getMySchedule(studentId, startDate, endDate, classId);

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};
