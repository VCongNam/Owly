import express from 'express';
import * as sepayService from './sepayService.js';

const router = express.Router();

// Endpoint webhook không có authMiddleware của hệ thống vì được gọi từ bên ngoài
router.post('/tuition/webhook/sepay', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const webhookToken = process.env.SEPAY_WEBHOOK_KEY || 'owly_secret_webhook_key';

    // Xác thực cuộc gọi bằng API Key được cấu hình trên Dashboard SePay
    if (authHeader && authHeader !== `ApiKey ${webhookToken}`) {
      return res.status(401).json({
        success: false,
        message: 'Mã xác thực Webhook của bên thứ 3 không hợp lệ',
      });
    }

    const transactionData = req.body;
    const result = await sepayService.processSepayWebhook(transactionData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Lỗi xử lý Webhook SePay:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống trong quá trình đối soát hóa đơn tự động',
      errors: [error.message],
    });
  }
});

export default router;
