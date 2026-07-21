import * as gradeCategoryService from './gradeCategoryService.js';

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
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục điểm không được để trống'
      });
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
