import * as classService from './classService.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';

export const createClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const data = req.body;

    const newClass = await classService.createClass(teacherId, data);

    // Format các ngày
    const formattedClass = {
      ...newClass,
      startDate: formatToVietnamTime(newClass.startDate),
      expectedEndDate: newClass.expectedEndDate ? formatToVietnamTime(newClass.expectedEndDate) : null,
      createdAt: formatToVietnamTime(newClass.createdAt)
    };

    return res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: formattedClass
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
    const { page, limit, search, status } = req.query;

    const result = await classService.getClasses(teacherId, {
      page,
      limit,
      search,
      status
    });

    // Format lại ngày tháng theo timezone Việt Nam cho từng lớp học
    const formattedItems = result.items.map(c => ({
      ...c,
      startDate: formatToVietnamTime(c.startDate),
      expectedEndDate: c.expectedEndDate ? formatToVietnamTime(c.expectedEndDate) : null,
      createdAt: formatToVietnamTime(c.createdAt)
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        pagination: result.pagination
      }
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
    const formattedClass = {
      ...classObj,
      startDate: formatToVietnamTime(classObj.startDate),
      expectedEndDate: classObj.expectedEndDate ? formatToVietnamTime(classObj.expectedEndDate) : null,
      createdAt: formatToVietnamTime(classObj.createdAt)
    };

    return res.status(200).json({
      success: true,
      data: formattedClass
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

    // Format ngày
    const formattedClass = {
      ...updatedClass,
      startDate: formatToVietnamTime(updatedClass.startDate),
      expectedEndDate: updatedClass.expectedEndDate ? formatToVietnamTime(updatedClass.expectedEndDate) : null,
      createdAt: formatToVietnamTime(updatedClass.createdAt)
    };

    return res.status(200).json({
      success: true,
      message: 'Cập nhật lớp học thành công',
      data: formattedClass
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

