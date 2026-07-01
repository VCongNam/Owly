import * as classService from './classService.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';

export const createClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const data = req.body;

    const newClass = await classService.createClass(teacherId, data);

    return res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: newClass
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Tạo lớp học thất bại'
    });
  }
};

export const getClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const classes = await classService.getClasses(teacherId);

    // Format lại ngày tháng theo timezone Việt Nam
    const formattedClasses = classes.map(c => ({
      ...c,
      startDate: formatToVietnamTime(c.startDate),
      createdAt: formatToVietnamTime(c.createdAt)
    }));

    return res.status(200).json({
      success: true,
      data: formattedClasses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lấy danh sách lớp học thất bại'
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;
    
    const classObj = await classService.getClassById(id, teacherId);

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Format ngày
    classObj.startDate = formatToVietnamTime(classObj.startDate);
    classObj.createdAt = formatToVietnamTime(classObj.createdAt);

    return res.status(200).json({
      success: true,
      data: classObj
    });
  } catch (error) {
    if (error.message.includes('không có quyền')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Lấy thông tin lớp học thất bại'
    });
  }
};

export const updateClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;
    const data = req.body;

    const updatedClass = await classService.updateClass(id, teacherId, data);

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học hoặc bạn không có quyền sửa'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật lớp học thành công',
      data: updatedClass
    });
  } catch (error) {
    if (error.message.includes('không có quyền')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Cập nhật lớp học thất bại'
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    const deletedClass = await classService.deleteClass(id, teacherId);

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học hoặc bạn không có quyền xóa'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa lớp học thành công'
    });
  } catch (error) {
    if (error.message.includes('không có quyền')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Xóa lớp học thất bại'
    });
  }
};
