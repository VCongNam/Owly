import { uploadFileToR2 } from '../../services/r2.service.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../utils/appError.js';

export const uploadFiles = async (req, res, next) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) throw new AppError('Không tìm thấy file', 400);

    // Xác định thư mục đích lưu trữ (mặc định là general)
    const folder = req.body.folder || req.query.folder || 'general';
    const safeFolder = /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : 'general';

    const attachmentUrls = [];
    for (const file of files) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${safeFolder}/${uuidv4()}.${fileExt}`;
      const url = await uploadFileToR2(file.buffer, fileName, file.mimetype);
      attachmentUrls.push(url);
    }

    res.status(200).json({ success: true, data: { attachmentUrls } });
  } catch (error) {
    next(error);
  }
};
