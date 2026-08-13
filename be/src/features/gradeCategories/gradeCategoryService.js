import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';

export const getOrCreateDefaultGradeCategory = async (classId) => {
  let categories = await prisma.gradeCategory.findMany({
    where: { classId },
    include: {
      _count: {
        select: { assignments: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  if (categories.length === 0) {
    const defaultCategory = await prisma.gradeCategory.create({
      data: {
        classId,
        name: 'Bài tập chung',
        weight: 1.0
      },
      include: {
        _count: {
          select: { assignments: true }
        }
      }
    });
    categories = [defaultCategory];
  }

  return categories;
};

export const getGradeCategoriesByClassId = async (classId) => {
  return getOrCreateDefaultGradeCategory(classId);
};

export const createGradeCategory = async ({ classId, name, weight = 0 }) => {
  return prisma.gradeCategory.create({
    data: {
      classId,
      name,
      weight
    },
    include: {
      _count: {
        select: { assignments: true }
      }
    }
  });
};

export const updateGradeCategory = async (id, { name, weight }) => {
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (weight !== undefined) data.weight = Number(weight);

  return prisma.gradeCategory.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { assignments: true }
      }
    }
  });
};

export const deleteGradeCategory = async (classId, id) => {
  const count = await prisma.gradeCategory.count({
    where: { classId }
  });

  if (count <= 1) {
    throw new AppError('Lớp học phải giữ ít nhất 1 danh mục đầu điểm.', 400);
  }

  const defaultCategories = await getOrCreateDefaultGradeCategory(classId);
  let fallbackCat = defaultCategories.find(c => c.id !== id);

  if (fallbackCat) {
    await prisma.assignment.updateMany({
      where: { gradeCategoryId: id },
      data: { gradeCategoryId: fallbackCat.id }
    });
  }

  return prisma.gradeCategory.delete({
    where: { id }
  });
};
