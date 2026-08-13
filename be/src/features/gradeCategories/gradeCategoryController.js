import * as gradeCategoryService from './gradeCategoryService.js';
import { AppError } from '../../utils/appError.js';

export const getGradeCategories = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const categories = await gradeCategoryService.getGradeCategoriesByClassId(classId);
    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const createGradeCategory = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name, weight } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Tên danh mục điểm không được để trống', 400));
    }

    const category = await gradeCategoryService.createGradeCategory({
      classId,
      name: name.trim(),
      weight: weight !== undefined ? Number(weight) : 0
    });

    return res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const updateGradeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, weight } = req.body;

    const updatedCategory = await gradeCategoryService.updateGradeCategory(id, { name, weight });
    return res.json({
      success: true,
      message: 'Cập nhật danh mục điểm thành công',
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGradeCategory = async (req, res, next) => {
  try {
    const { classId, id } = req.params;
    await gradeCategoryService.deleteGradeCategory(classId, id);
    return res.json({
      success: true,
      message: 'Đã xóa danh mục điểm và tự động chuyển các bài tập liên quan về "Bài tập chung".'
    });
  } catch (error) {
    next(error);
  }
};
