import * as studentService from './studentService.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';

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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin học viên'
      });
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
    const teacherId = req.user.id;
    const { classId } = req.params;
    const { page, limit, search } = req.query;

    const result = await studentService.getStudentsOfTeacherClasses(teacherId, {
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
