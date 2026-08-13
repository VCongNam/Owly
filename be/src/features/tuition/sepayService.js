import { prisma } from '../../config/db.js';
import dayjs from 'dayjs';

export const processSepayWebhook = async (transactionData) => {
  const { content, transferAmount } = transactionData;
  if (!content) {
    return { success: false, message: 'Nội dung giao dịch trống' };
  }

  const cleanContent = content.trim();
  let invoice = null;

  // Hướng 1: Tìm bằng mã hóa đơn rút gọn HP-xxxxxx (ví dụ HP-d7a80f0a hoặc HPd7a80f0a)
  const invoiceCodeMatch = cleanContent.match(/HP[-]?([a-f0-9]{8})/i);
  if (invoiceCodeMatch) {
    const shortId = invoiceCodeMatch[1].toLowerCase();
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { startsWith: shortId },
        status: { in: ['Unpaid', 'Pending'] },
      },
    });
    if (invoices.length > 0) {
      invoice = invoices[0];
    }
  }

  // Hướng 2: Tìm bằng mã học sinh (HSxxx) và tháng thu phí (MM/YYYY hoặc YYYY-MM)
  if (!invoice) {
    const studentCodeMatch = cleanContent.match(/HS\d+/i);
    if (studentCodeMatch) {
      const studentCode = studentCodeMatch[0].toUpperCase();
      const student = await prisma.student.findUnique({
        where: { studentCode },
      });

      if (student) {
        const searchConditions = {
          studentId: student.id,
          status: { in: ['Unpaid', 'Pending'] },
        };

        // Tìm tháng chuyển khoản (ví dụ 07/2026 hoặc 07-2026)
        const billingMonthMatch = cleanContent.match(/(\d{2})[\/\-](\d{4})/);
        if (billingMonthMatch) {
          const [_, month, year] = billingMonthMatch;
          searchConditions.billingMonth = `${year}-${month}`;
        }

        const invoices = await prisma.invoice.findMany({
          where: searchConditions,
          orderBy: { createdAt: 'desc' },
        });

        if (invoices.length > 0) {
          // Ưu tiên chọn hóa đơn có số tiền trùng khớp hoặc hóa đơn mới nhất
          invoice = invoices.find(inv => Math.abs(inv.amount - transferAmount) < 10) || invoices[0];
        }
      }
    }
  }

  if (!invoice) {
    return {
      success: false,
      message: 'Không tìm thấy hóa đơn phù hợp cho nội dung giao dịch này',
    };
  }

  // Kiểm tra số tiền chuyển khoản có đủ thanh toán hóa đơn không
  if (transferAmount < invoice.amount) {
    return {
      success: false,
      message: `Số tiền thanh toán (${transferAmount} VNĐ) nhỏ hơn số tiền trên hóa đơn (${invoice.amount} VNĐ)`,
      invoiceId: invoice.id,
    };
  }

  const cls = await prisma.class.findUnique({
    where: { id: invoice.classId },
  });

  // Thực hiện cập nhật trạng thái hóa đơn & tạo giao dịch thành công trong transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: 'Paid' },
    });

    const transaction = await tx.transaction.create({
      data: {
        invoiceId: invoice.id,
        paymentMethod: 'VietQR',
        amountPaid: transferAmount,
        proofUrl: 'VietQR Auto-reconciled',
        transactionStatus: 'Approved',
        processedById: cls?.teacherId || null,
      },
    });

    return { updatedInvoice, transaction };
  });

  return {
    success: true,
    message: 'Đối soát tự động thành công',
    data: result,
  };
};
