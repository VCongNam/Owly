import * as classService from './classService.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';
import { requireTeacher } from '../../utils/authHelpers.js';

export const createClass = async (req, res, next) => {
  try {
    requireTeacher(req);

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
    next(error);
  }
};

export const getClasses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, search, status } = req.query;

    const result = await classService.getClasses(userId, userRole, {
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
    next(error);
  }
};

export const getClassById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;
    
    const classObj = await classService.getClassById(id, userId, userRole);

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
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;
    const data = req.body;

    const updatedClass = await classService.updateClass(id, teacherId, data);

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
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { id } = req.params;

    await classService.deleteClass(id, teacherId);

    return res.status(200).json({
      success: true,
      message: 'Xóa lớp học thành công'
    });
  } catch (error) {
    next(error);
  }
};
