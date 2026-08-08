import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/appError.js';

export const createFeedback = async (req, res, next) => {
  try {
    const { type, title, content, attachmentUrls } = req.body;
    const accountId = req.user.id; // From authMiddleware

    const feedback = await prisma.systemFeedback.create({
      data: {
        accountId,
        type,
        title,
        content,
        attachmentUrls: attachmentUrls || [],
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

export const uploadImage = async (req, res, next) => {
  try {
    const files = req.files;
    const userId = req.user.id;
    if (!files || files.length === 0) throw new AppError('Không tìm thấy file ảnh', 400);

    const attachmentUrls = [];

    for (const file of files) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `feedback-${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `feedbacks/${fileName}`; 

      const { error } = await supabase
        .storage
        .from('Owly')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw new AppError(`Upload lỗi: ${error.message}`, 500);


      const { data: publicUrlData } = supabase
        .storage
        .from('Owly')
        .getPublicUrl(filePath);

      attachmentUrls.push(publicUrlData.publicUrl);
    }

    return res.status(200).json({
      success: true,
      data: { attachmentUrls }
    });
  } catch (error) {
    next(error);
  }
};
