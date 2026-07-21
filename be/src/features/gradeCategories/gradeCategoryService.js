import { prisma } from '../../config/db.js';

export const getOrCreateDefaultGradeCategory = async (classId) => {
  let categories = await prisma.gradeCategory.findMany({
    where: { classId },
    orderBy: { name: 'asc' }
  });

  if (categories.length === 0) {
    const defaultCategory = await prisma.gradeCategory.create({
      data: {
        classId,
        name: 'Bài tập chung',
        weight: 1.0
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
    }
  });
};
