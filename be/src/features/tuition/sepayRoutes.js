import express from 'express';
import * as sepayService from './sepayService.js';
import { AppError } from '../../utils/appError.js';

const router = express.Router();

// Endpoint webhook không có authMiddleware của hệ thống vì được gọi từ bên ngoài
router.post('/tuition/webhook/sepay', async (req, res, next) => {
  // Feature flag: SePay đang tạm hoãn — trả 503 qua error handler chung để khớp error contract
  if (process.env.SEPAY_ENABLED !== 'true') {
    return next(new AppError('Tính năng đối soát SePay chưa được kích hoạt', 503));
  }

  try {
    // Kiểm tra cấu hình key — fail-closed nếu biến môi trường thiếu
    const webhookToken = process.env.SEPAY_WEBHOOK_KEY;
    if (!webhookToken) {
      return next(new AppError('Chưa cấu hình SePay Webhook Key trên máy chủ', 500));
    }

    // Kiểm tra Authorization header — thiếu hoặc sai đều từ chối
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `ApiKey ${webhookToken}`) {
      return next(new AppError('Mã xác thực Webhook không hợp lệ hoặc thiếu', 401));
    }

    const transactionData = req.body;
    const result = await sepayService.processSepayWebhook(transactionData);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message, errors: [] });
    }

    return res.json({ success: true, data: result.data, message: result.message });
  } catch (error) {
    next(error);
  }
});

export default router;

