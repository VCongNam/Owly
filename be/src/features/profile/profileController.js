import * as profileService from './profileService.js';
import { updateProfileSchema } from './profileSchema.js';
import { AppError } from '../../utils/appError.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return next(new AppError('Không tìm thấy hồ sơ cá nhân', 404));
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate — ZodError sẽ đi qua catch và được xử lý
    const validatedData = updateProfileSchema.parse(req.body);

    const updated = await profileService.updateProfile(userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: updated
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      // Ánh xạ ZodError thành AppError có errors[] chuẩn — validation middleware ưu tiên nhưng nếu validate() thủ công tại đây thì xử lý đúng
      const appErr = new AppError('Dữ liệu không hợp lệ', 400);
      appErr.errors = error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(appErr);
    }
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return next(new AppError('Vui lòng chọn ảnh để tải lên', 400));
    }

    const result = await profileService.uploadAvatar(userId, file);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
