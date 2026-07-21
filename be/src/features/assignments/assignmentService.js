import { prisma } from '../../config/db.js';
import { getOrCreateDefaultGradeCategory } from '../gradeCategories/gradeCategoryService.js';

export const createAssignment = async (data) => {
  if (!data.gradeCategoryId) {
    const categories = await getOrCreateDefaultGradeCategory(data.classId);
    data.gradeCategoryId = categories[0].id;
  }

  return prisma.assignment.create({
    data
  });
};

export const getAssignmentsByClassId = async (classId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    prisma.assignment.findMany({
      where: { classId },
      include: {
        category: true
      },
      orderBy: {
        dueDate: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.assignment.count({
      where: { classId }
    })
  ]);

  return {
    items,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit
    }
  };
};

export const updateAssignment = async (id, data) => {
  return prisma.assignment.update({
    where: { id },
    data
  });
};

export const deleteAssignment = async (id) => {
  return prisma.assignment.delete({
    where: { id }
  });
};
