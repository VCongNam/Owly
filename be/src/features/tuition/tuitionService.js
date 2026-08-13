import { prisma } from '../../config/db.js';
import dayjs from 'dayjs';
import { AppError } from '../../utils/appError.js';
import { assertClassAccess } from '../../utils/authHelpers.js';

export const getClassTuitionConfig = async (classId, userId, userRole) => {
  await assertClassAccess(userId, userRole, classId);

  const config = await prisma.classTum.findUnique({
    where: { classId },
  });

  return {
    classId,
    amount: config?.amount || 0,
    billingCycle: config?.billingCycle || 'Monthly',
  };
};

export const upsertClassTuitionConfig = async (classId, teacherId, { amount, billingCycle }) => {
  await assertClassAccess(teacherId, 'teacher', classId);

  const config = await prisma.classTum.upsert({
    where: { classId },
    update: { amount, billingCycle: billingCycle || 'Monthly' },
    create: { classId, amount, billingCycle: billingCycle || 'Monthly' },
  });

  return config;
};

export const generateMonthlyInvoices = async (classId, teacherId, { billingMonth, dueDate, amountPerSession }) => {
  // 0. Chặn phát hành hóa đơn cho các tháng trong tương lai (sau tháng hiện tại)
  const currentMonthStr = dayjs().format('YYYY-MM');
  if (billingMonth > currentMonthStr) {
    throw new AppError('Không thể phát hành hóa đơn học phí cho các tháng trong tương lai', 400);
  }

  // 1. Kiểm tra lớp học có tồn tại và thuộc về giáo viên không
  const cls = await assertClassAccess(teacherId, 'teacher', classId);

  // 2. Xác định đơn giá/buổi
  let rate = amountPerSession;
  if (rate === undefined || rate === null) {
    const tum = await prisma.classTum.findUnique({ where: { classId } });
    rate = tum?.amount || 0;
  }

  // 3. Đếm số buổi học trong tháng (không tính các buổi bị hủy)
  const [yearStr, monthStr] = billingMonth.split('-');
  const startOfMonth = dayjs(`${yearStr}-${monthStr}-01`).startOf('month').toDate();
  const endOfMonth = dayjs(`${yearStr}-${monthStr}-01`).endOf('month').toDate();

  const sessionCount = await prisma.session.count({
    where: {
      classId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: { not: 'Cancelled' },
    },
  });

  const totalAmountPerStudent = sessionCount * rate;

  // 4. Lấy danh sách học viên đang theo học (isActive = true)
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId, isActive: true },
    include: {
      student: true,
    },
  });

  if (enrollments.length === 0) {
    throw new AppError('Lớp học chưa có học viên nào đang tham gia', 400);
  }

  const [month, year] = [monthStr, yearStr];
  const invoiceTitle = `Học phí Tháng ${month}/${year} - ${cls.name}`;

  // 5. Thực hiện upsert hóa đơn cho từng học viên trong transaction
  const generatedInvoices = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of enrollments) {
      // Tìm hóa đơn đã có cho tháng này nếu có
      const existing = await tx.invoice.findFirst({
        where: {
          classId,
          studentId: item.studentId,
          billingMonth,
        },
      });

      if (existing) {
        // Chỉ cập nhật nếu hóa đơn chưa được thanh toán (Unpaid hoặc Pending)
        if (existing.status !== 'Paid') {
          const updated = await tx.invoice.update({
            where: { id: existing.id },
            data: {
              title: invoiceTitle,
              sessionCount,
              amount: totalAmountPerStudent,
              dueDate: new Date(dueDate),
            },
          });
          results.push(updated);
        } else {
          results.push(existing);
        }
      } else {
        const created = await tx.invoice.create({
          data: {
            classId,
            studentId: item.studentId,
            title: invoiceTitle,
            billingMonth,
            sessionCount,
            amount: totalAmountPerStudent,
            dueDate: new Date(dueDate),
            status: 'Unpaid',
          },
        });
        results.push(created);
      }
    }
    return results;
  });

  return {
    billingMonth,
    sessionCount,
    ratePerSession: rate,
    totalAmountPerStudent,
    totalInvoicesGenerated: generatedInvoices.length,
    invoices: generatedInvoices,
  };
};

export const getClassInvoices = async (classId, userId, userRole, { page = 1, limit = 10, billingMonth, status, search }) => {
  await assertClassAccess(userId, userRole, classId);

  const skip = (page - 1) * limit;

  const whereClause = {
    classId,
    ...(billingMonth ? { billingMonth } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          student: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { studentCode: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [totalItems, items, allInvoicesForStats, pastSessions, existingInvoices] = await Promise.all([
    prisma.invoice.count({ where: whereClause }),
    prisma.invoice.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            fullName: true,
            parentPhone: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        classId,
        ...(billingMonth ? { billingMonth } : {}),
      },
      select: {
        amount: true,
        status: true,
      },
    }),
    prisma.session.findMany({
      where: {
        classId,
        date: { lt: dayjs().startOf('month').toDate() },
        status: { not: 'Cancelled' },
      },
      select: { date: true },
    }),
    prisma.invoice.findMany({
      where: { classId },
      select: { billingMonth: true },
      distinct: ['billingMonth'],
    }),
  ]);

  const stats = allInvoicesForStats.reduce(
    (acc, inv) => {
      acc.totalExpected += inv.amount;
      if (inv.status === 'Paid') acc.totalCollected += inv.amount;
      else if (inv.status === 'Pending') acc.totalPending += inv.amount;
      else if (inv.status === 'Unpaid') acc.totalUnpaid += inv.amount;
      return acc;
    },
    { totalExpected: 0, totalCollected: 0, totalPending: 0, totalUnpaid: 0 }
  );

  const pastSessionMonths = Array.from(
    new Set(pastSessions.map((s) => dayjs(s.date).format('YYYY-MM')))
  ).sort();
  const existingBillingMonths = new Set(existingInvoices.map((i) => i.billingMonth));
  const unbilledPastMonths = pastSessionMonths.filter((m) => !existingBillingMonths.has(m));

  return {
    items,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
      currentPage: page,
      limit,
    },
    stats,
    unbilledPastMonths,
  };
};

export const getStudentInvoices = async (studentId) => {
  const invoices = await prisma.invoice.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
          teacher: {
            select: {
              fullName: true,
              bankName: true,
              bankAccountNo: true,
              bankAccountName: true,
              bankBin: true,
            },
          },
        },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return invoices;
};

export const submitPaymentProof = async (studentId, invoiceId, { proofUrl, amountPaid }) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { class: true },
  });

  if (!invoice) {
    throw new AppError('Không tìm thấy hóa đơn', 404);
  }

  if (invoice.studentId !== studentId) {
    throw new AppError('Bạn không có quyền thực hiện thanh toán cho hóa đơn này', 403);
  }

  const transaction = await prisma.transaction.create({
    data: {
      invoiceId,
      paymentMethod: 'VietQR',
      amountPaid: amountPaid || invoice.amount,
      proofUrl,
      transactionStatus: 'Pending',
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'Pending' },
  });

  return transaction;
};

export const reviewTransaction = async (teacherId, transactionId, { status, rejectionReason }) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      invoice: {
        include: { class: true },
      },
    },
  });

  if (!transaction) {
    throw new AppError('Không tìm thấy giao dịch', 404);
  }

  if (transaction.invoice.class.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền duyệt giao dịch của lớp học này', 403);
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      transactionStatus: status,
      processedById: teacherId,
      rejectionReason: status === 'Rejected' ? rejectionReason : null,
    },
  });

  const newInvoiceStatus = status === 'Approved' ? 'Paid' : 'Unpaid';

  await prisma.invoice.update({
    where: { id: transaction.invoiceId },
    data: { status: newInvoiceStatus },
  });

  return updatedTransaction;
};

export const getTeacherPendingInvoices = async (teacherId) => {
  return await prisma.invoice.findMany({
    where: {
      status: 'Pending',
      class: {
        teacherId,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          studentCode: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
        },
      },
      transactions: {
        where: {
          transactionStatus: 'Pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
};

