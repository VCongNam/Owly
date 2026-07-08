import { prisma } from '../../config/db.js';

// Hàm xác định trạng thái dựa trên thời gian
export const determineStatus = (startDate, expectedEndDate, existingStatus = null) => {
  if (existingStatus === 'Archived') {
    return 'Archived';
  }
  const now = new Date();
  const start = new Date(startDate);
  const end = expectedEndDate ? new Date(expectedEndDate) : null;
  
  if (end && end < now) {
    return 'Completed';
  }
  if (start > now) {
    return 'Scheduled';
  }
  return 'OnGoing';
};

// Hàm lấy trạng thái thực tế khi đọc từ DB
export const getEffectiveStatus = (cls) => {
  if (!cls) return null;
  if (cls.status === 'Archived') {
    return 'Archived';
  }
  const now = new Date();
  const start = new Date(cls.startDate);
  const end = cls.expectedEndDate ? new Date(cls.expectedEndDate) : null;

  if (end && end < now) {
    return 'Completed';
  }
  if (start > now) {
    return 'Scheduled';
  }
  return 'OnGoing';
};

// Hàm tự động sinh mã lớp (Ví dụ: LHP001, LHP002...)
const generateClassCode = async (tx) => {
  const lastClass = await tx.class.findFirst({
    orderBy: { classCode: 'desc' }
  });
  
  let nextNum = 1;
  if (lastClass && lastClass.classCode.startsWith('LHP')) {
    const lastNum = parseInt(lastClass.classCode.replace('LHP', ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  
  return `LHP${String(nextNum).padStart(3, '0')}`;
};

export const createClass = async (teacherId, data) => {
  return await prisma.$transaction(async (tx) => {
    const classCode = await generateClassCode(tx);
    
    // Tự động tính toán status ban đầu dựa trên ngày tháng
    const computedStatus = determineStatus(
      data.startDate,
      data.expectedEndDate
    );

    // 1. Tạo lớp học
    const newClass = await tx.class.create({
      data: {
        classCode: classCode,
        name: data.name,
        teacherId: teacherId,
        startDate: new Date(data.startDate),
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        subjectId: data.subjectId || null,
        status: computedStatus,
      }
    });

    // 2. Tạo cấu hình học phí
    if (data.tuitionAmount !== undefined && data.tuitionAmount !== null) {
      await tx.classTum.create({
        data: {
          classId: newClass.id,
          amount: data.tuitionAmount,
          billingCycle: data.billingCycle || 'Monthly',
        }
      });
    }

    // 3. Tạo danh sách lịch học linh hoạt
    if (data.schedules && data.schedules.length > 0) {
      await tx.classSchedule.createMany({
        data: data.schedules.map(sch => ({
          classId: newClass.id,
          dayOfWeek: sch.dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
          room: sch.room || ''
        }))
      });
    }

    const created = await tx.class.findUnique({
      where: { id: newClass.id },
      include: {
        subject: true,
        schedules: true,
        tuitionConfig: true
      }
    });

    return {
      ...created,
      status: getEffectiveStatus(created)
    };
  });
};

export const getClasses = async (teacherId, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 9;
  const search = options.search || '';
  const status = options.status || null;
  const skip = (page - 1) * limit;

  // Xây dựng điều kiện truy vấn
  const where = {
    teacherId,
  };

  // Lọc theo từ khóa tìm kiếm (không phân biệt hoa thường)
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Lọc theo trạng thái
  if (status) {
    if (status === 'active_only') {
      where.status = {
        not: 'Archived',
      };
    } else {
      where.status = status;
    }
  }

  // Lấy tổng số bản ghi thỏa mãn điều kiện
  const totalItems = await prisma.class.count({ where });

  // Lấy danh sách lớp học phân trang
  const classes = await prisma.class.findMany({
    where,
    include: {
      subject: true,
      schedules: true,
      tuitionConfig: true
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const formattedItems = classes.map(c => ({
    ...c,
    status: getEffectiveStatus(c)
  }));

  const totalPages = Math.ceil(totalItems / limit);

  return {
    items: formattedItems,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

export const getClassById = async (id, teacherId) => {
  const classObj = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          fullName: true,
          teacherCode: true
        }
      },
      subject: true,
      schedules: true,
      tuitionConfig: true
    }
  });

  if (!classObj) return null;
  
  if (classObj.teacherId !== teacherId) {
    throw new Error('Bạn không có quyền truy cập lớp học này');
  }

  return {
    ...classObj,
    status: getEffectiveStatus(classObj)
  };
};

export const updateClass = async (id, teacherId, data) => {
  // Lấy ra class hiện tại để tính toán status chính xác
  const existingClass = await prisma.class.findUnique({ where: { id } });
  if (!existingClass || existingClass.teacherId !== teacherId) return null;

  const newStartDate = data.startDate || existingClass.startDate;
  const newExpectedEndDate = data.expectedEndDate !== undefined ? data.expectedEndDate : existingClass.expectedEndDate;
  const targetStatus = data.status || existingClass.status;
  
  // Tính toán status: nếu user muốn Archived thì lưu Archived, ngược lại tính theo thời gian
  const computedStatus = targetStatus === 'Archived' 
    ? 'Archived' 
    : determineStatus(newStartDate, newExpectedEndDate);

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật thông tin cơ bản
    await tx.class.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expectedEndDate: data.expectedEndDate !== undefined ? (data.expectedEndDate ? new Date(data.expectedEndDate) : null) : undefined,
        subjectId: data.subjectId !== undefined ? data.subjectId : undefined,
        status: computedStatus,
      }
    });

    // 2. Cập nhật học phí
    if (data.tuitionAmount !== undefined) {
      if (data.tuitionAmount === null) {
        await tx.classTum.deleteMany({
          where: { classId: id }
        });
      } else {
        await tx.classTum.upsert({
          where: { classId: id },
          update: {
            amount: data.tuitionAmount,
            billingCycle: data.billingCycle || 'Monthly',
          },
          create: {
            classId: id,
            amount: data.tuitionAmount,
            billingCycle: data.billingCycle || 'Monthly',
          }
        });
      }
    } else if (data.billingCycle !== undefined) {
      await tx.classTum.updateMany({
        where: { classId: id },
        data: {
          billingCycle: data.billingCycle,
        }
      });
    }

    // 3. Cập nhật lịch học
    if (data.schedules !== undefined) {
      await tx.classSchedule.deleteMany({
        where: { classId: id }
      });
      if (data.schedules && data.schedules.length > 0) {
        await tx.classSchedule.createMany({
          data: data.schedules.map(sch => ({
            classId: id,
            dayOfWeek: sch.dayOfWeek,
            startTime: sch.startTime,
            endTime: sch.endTime,
            room: sch.room || ''
          }))
        });
      }
    }

    const updated = await tx.class.findUnique({
      where: { id },
      include: {
        subject: true,
        schedules: true,
        tuitionConfig: true
      }
    });

    return {
      ...updated,
      status: getEffectiveStatus(updated)
    };
  });
};

export const deleteClass = async (id, teacherId) => {
  const existingClass = await prisma.class.findUnique({ where: { id } });
  if (!existingClass || existingClass.teacherId !== teacherId) return null;

  return await prisma.class.delete({
    where: { id }
  });
};
