import { prisma } from '../../config/db.js';

export const createFeedback = async (req, res, next) => {
  try {
    const { type, title, content } = req.body;
    const accountId = req.user.id; // From authMiddleware

    const feedback = await prisma.systemFeedback.create({
      data: {
        accountId,
        type,
        title,
        content,
        status: 'Pending'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi phản hồi thành công. Cảm ơn bạn đã đóng góp ý kiến!',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

export const getMyFeedbacks = async (req, res, next) => {
  try {
    const accountId = req.user.id;

    const feedbacks = await prisma.systemFeedback.findMany({
      where: {
        accountId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};
