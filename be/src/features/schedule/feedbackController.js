import * as feedbackService from './feedbackService.js';

export const getSessionFeedbacks = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { sessionId } = req.params;

    const data = await feedbackService.getSessionFeedbacks(sessionId, teacherId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const upsertSessionFeedbacks = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { sessionId } = req.params;
    const { feedbacks } = req.body;

    if (!Array.isArray(feedbacks)) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách nhận xét (feedbacks) phải là một mảng.'
      });
    }

    const data = await feedbackService.upsertSessionFeedbacks(sessionId, teacherId, feedbacks);

    return res.status(200).json({
      success: true,
      message: 'Lưu nhận xét buổi học thành công',
      data
    });
  } catch (error) {
    next(error);
  }
};
