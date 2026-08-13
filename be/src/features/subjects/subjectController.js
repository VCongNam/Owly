import { prisma } from '../../config/db.js';
import { formatToVietnamTime } from '../../utils/dateHelper.js';

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' }
    });

    // Định dạng trường createdAt sang múi giờ Việt Nam (+07) trước khi trả về
    const formattedSubjects = subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      createdAt: formatToVietnamTime(sub.createdAt)
    }));

    return res.status(200).json({
      success: true,
      data: formattedSubjects
    });
  } catch (error) {
    next(error);
  }
};

