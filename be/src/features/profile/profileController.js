import * as profileService from './profileService.js';
import { updateProfileSchema } from './profileSchema.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ cá nhân'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy hồ sơ',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validate
    const validatedData = updateProfileSchema.parse(req.body);

    const updated = await profileService.updateProfile(userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: updated
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi cập nhật hồ sơ',
      error: error.message
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh để tải lên'
      });
    }

    const result = await profileService.uploadAvatar(userId, file);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống khi tải ảnh'
    });
  }
};
