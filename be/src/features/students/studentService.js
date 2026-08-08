import { prisma } from '../../config/db.js';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/appError.js';

// Tự động sinh mã học viên kế tiếp dạng HS001, HS002...
export const generateStudentCode = async (tx) => {
  const lastStudent = await tx.student.findFirst({
    orderBy: { studentCode: 'desc' }
  });
  
  let nextNum = 1;
  if (lastStudent && lastStudent.studentCode.startsWith('HS')) {
    const lastNum = parseInt(lastStudent.studentCode.replace('HS', ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  
  return `HS${String(nextNum).padStart(3, '0')}`;
};

// Lấy danh sách học viên của các lớp do giáo viên giảng dạy
export const getStudentsOfTeacherClasses = async (teacherId, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const search = options.search || '';
  const classId = options.classId || '';
  const skip = (page - 1) * limit;

  // Điều kiện lọc: học viên có tham gia ít nhất 1 lớp học của giáo viên này
  const where = {
    enrollments: {
      some: {
        class: {
          teacherId: teacherId
        }
      }
    }
  };

  // Nếu lọc chi tiết theo một lớp học cụ thể
  if (classId) {
    where.enrollments.some.classId = classId;
  }

  // Tìm kiếm tương đối theo Họ tên, SĐT phụ huynh, hoặc Tên đăng nhập học sinh
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { parentPhone: { contains: search, mode: 'insensitive' } },
      { studentCode: { contains: search, mode: 'insensitive' } }
    ];
  }

  const totalItems = await prisma.student.count({ where });

  const students = await prisma.student.findMany({
    where,
    include: {
      account: {
        select: {
          email: true,
          phone: true,
          avatarUrl: true
        }
      },
      enrollments: {
        where: {
          class: {
            teacherId: teacherId
          }
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              classCode: true
            }
          }
        }
      }
    },
    orderBy: { studentCode: 'asc' },
    skip,
    take: limit
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    items: students,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

// Giáo viên tìm kiếm học viên trên toàn hệ thống (để thêm học sinh đã có sẵn vào lớp)
export const searchStudentsInDirectory = async (teacherId, searchKey = '') => {
  if (!searchKey || searchKey.trim().length < 2) {
    return [];
  }

  // Tìm kiếm theo Họ tên hoặc SĐT phụ huynh
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { fullName: { contains: searchKey, mode: 'insensitive' } },
        { parentPhone: { contains: searchKey, mode: 'insensitive' } }
      ]
    },
    include: {
      account: {
        select: {
          email: true,
          phone: true
        }
      }
    },
    take: 10
  });

  return students;
};

// Ghi danh một học sinh đã có sẵn vào lớp học
export const enrollExistingStudent = async (classId, studentId, teacherId) => {
  // 1. Kiểm tra lớp học có tồn tại và thuộc quyền sở hữu của giáo viên này không
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!targetClass) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền sở hữu lớp học này', 404);
  }

  // 2. Kiểm tra học sinh có tồn tại trong hệ thống không
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    throw new AppError('Học viên không tồn tại trên hệ thống', 404);
  }

  // 3. Kiểm tra xem học sinh đã được ghi danh vào lớp này chưa
  const existingEnrollment = await prisma.classEnrollment.findUnique({
    where: {
      classId_studentId: {
        classId,
        studentId
      }
    }
  });

  if (existingEnrollment) {
    throw new AppError('Học viên đã đăng ký học lớp này rồi', 409);
  }

  // 4. Tạo ghi danh mới
  return await prisma.classEnrollment.create({
    data: {
      classId,
      studentId,
      isActive: true
    },
    include: {
      student: true
    }
  });
};

// Tạo tài khoản học sinh mới và ghi danh trực tiếp vào lớp học
export const createAndEnrollStudent = async (classId, teacherId, studentData) => {
  // 1. Kiểm tra lớp học thuộc quyền giáo viên
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!targetClass) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền sở hữu lớp học này', 404);
  }

  // 2. Chạy transaction để tự sinh mã và tạo dữ liệu đồng bộ
  return await prisma.$transaction(async (tx) => {
    const studentCode = await generateStudentCode(tx);
    const email = `${studentCode.toLowerCase()}@owly.vn`;
    const password = 'Owly@123456'; // Mật khẩu mặc định

    // 3. Tạo tài khoản trong Supabase Auth bằng Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        full_name: studentData.fullName
      }
    });

    if (authError) {
      throw new AppError(`Lỗi khởi tạo tài khoản trên Auth Server: ${authError.message}`, 500);
    }

    const studentId = authData.user.id;

    // 4. Tạo Account cục bộ
    await tx.account.create({
      data: {
        id: studentId,
        email,
        passwordHash: 'EXTERNAL_SUPABASE_AUTH',
        isActive: true
      }
    });

    // 5. Tạo Student cục bộ
    const student = await tx.student.create({
      data: {
        id: studentId,
        studentCode,
        fullName: studentData.fullName,
        dateOfBirth: new Date(studentData.dateOfBirth),
        parentPhone: studentData.parentPhone,
        createdById: teacherId
      }
    });

    // 6. Ghi danh học viên vào lớp học hiện tại
    await tx.classEnrollment.create({
      data: {
        classId,
        studentId,
        isActive: true
      }
    });

    return student;
  });
};

// Hủy ghi danh học viên khỏi lớp học (Unenroll)
export const unenrollStudentFromClass = async (classId, studentId, teacherId) => {
  // 1. Kiểm tra quyền sở hữu lớp của giáo viên
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!targetClass) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền sở hữu lớp học này', 404);
  }

  // 2. Thực hiện xóa liên kết ClassEnrollment
  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      classId_studentId: {
        classId,
        studentId
      }
    }
  });

  if (!enrollment) {
    throw new AppError('Học viên không có liên kết ghi danh với lớp học này', 404);
  }

  return await prisma.classEnrollment.delete({
    where: {
      classId_studentId: {
        classId,
        studentId
      }
    }
  });
};

// Học sinh tự cập nhật thông tin cá nhân của mình
export const studentUpdateOwnProfile = async (studentId, data) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    throw new AppError('Học viên không tồn tại trên hệ thống', 404);
  }

  // Nếu có cập nhật email cá nhân thật
  if (data.email) {
    // Kiểm tra xem email thật này đã có tài khoản nào khác dùng chưa
    const existing = await prisma.account.findUnique({
      where: { email: data.email }
    });

    if (existing && existing.id !== studentId) {
      throw new AppError('Email này đã được sử dụng bởi một tài khoản khác', 409);
    }

    // Cập nhật thông tin email đăng nhập trong Supabase Auth qua Admin API
    const { error: authError } = await supabase.auth.admin.updateUserById(studentId, {
      email: data.email
    });

    if (authError) {
      throw new AppError(`Lỗi cập nhật email trên Auth Server: ${authError.message}`, 500);
    }
  }

  // Chạy transaction cập nhật thông tin cá nhân cục bộ
  return await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: studentId },
      data: {
        email: data.email || undefined,
        phone: data.phone || undefined
      }
    });

    return await tx.student.update({
      where: { id: studentId },
      data: {
        fullName: data.fullName || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        parentPhone: data.parentPhone || undefined
      }
    });
  });
};

// Lấy chi tiết thông tin một học sinh (giáo viên kiểm tra quyền truy cập)
export const getStudentById = async (id, teacherId) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      account: {
        select: {
          email: true,
          phone: true,
          avatarUrl: true
        }
      },
      enrollments: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              classCode: true,
              teacherId: true
            }
          }
        }
      }
    }
  });

  if (!student) return null;

  // Kiểm tra xem học sinh có thuộc lớp nào của giáo viên này phụ trách không
  const isEnrolledInTeacherClasses = student.enrollments.some(e => e.class.teacherId === teacherId);
  const isCreatedByTeacher = student.createdById === teacherId;

  if (!isEnrolledInTeacherClasses && !isCreatedByTeacher) {
    throw new AppError('Bạn không có quyền truy cập thông tin học viên này', 403);
  }

  return student;
};

// UC-35: Lấy nhật ký điểm danh tổng hợp của một học sinh trong một lớp học
export const getStudentAttendanceLog = async (classId, studentId, teacherId) => {
  // 1. Xác thực lớp học có thuộc giáo viên không
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!targetClass) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền truy cập lớp học này', 404);
  }

  // 2. Xác thực học sinh có ghi danh trong lớp không
  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      classId_studentId: { classId, studentId }
    },
    include: {
      student: true
    }
  });

  if (!enrollment) {
    throw new AppError('Học viên không tham gia lớp học này', 404);
  }

  // 3. Lấy toàn bộ buổi học của lớp (sắp xếp theo ngày tăng dần)
  const sessions = await prisma.session.findMany({
    where: { classId },
    orderBy: { date: 'desc' }
  });

  // 4. Lấy toàn bộ bản ghi điểm danh của học sinh trong lớp này
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      session: { classId }
    }
  });

  // 5. Map bản ghi điểm danh theo sessionId để tra cứu nhanh
  const attendanceMap = new Map();
  attendances.forEach(att => attendanceMap.set(att.sessionId, att));

  // 6. Tạo danh sách chi tiết từng buổi học với trạng thái điểm danh
  const sessionLogs = sessions.map(session => {
    const att = attendanceMap.get(session.id);
    return {
      sessionId: session.id,
      date: session.date,
      title: session.title || null,
      sessionStatus: session.status, // Scheduled | Completed | Cancelled
      attendanceStatus: att ? att.status : null, // Present | Absent | Late | Excused | null (chưa điểm danh)
      notes: att ? att.notes : null,
      updatedAt: att ? att.updatedAt : null
    };
  });

  // 7. Tính thống kê chuyên cần chỉ trên các buổi đã Completed và có điểm danh
  const attendedSessions = sessionLogs.filter(s => s.attendanceStatus !== null);
  const totalTracked = attendedSessions.length;
  const totalSessions = sessions.length;

  const stats = {
    totalSessions,
    totalTracked,
    present: attendedSessions.filter(s => s.attendanceStatus === 'Present').length,
    absent: attendedSessions.filter(s => s.attendanceStatus === 'Absent').length,
    late: attendedSessions.filter(s => s.attendanceStatus === 'Late').length,
    excused: attendedSessions.filter(s => s.attendanceStatus === 'Excused').length,
  };

  // Tỉ lệ chuyên cần: Có mặt + Đi muộn trên tổng buổi đã điểm danh
  stats.attendanceRate = totalTracked > 0
    ? Math.round(((stats.present + stats.late) / totalTracked) * 100)
    : null;

  return {
    student: {
      id: enrollment.student.id,
      fullName: enrollment.student.fullName,
      studentCode: enrollment.student.studentCode
    },
    class: {
      id: targetClass.id,
      name: targetClass.name,
      classCode: targetClass.classCode
    },
    stats,
    sessions: sessionLogs
  };
};

// Học sinh xem danh sách lớp mình đang học
export const getMyClasses = async (studentId) => {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      studentId,
      isActive: true
    },
    include: {
      class: {
        include: {
          subject: true,
          teacher: {
            select: {
              id: true,
              fullName: true,
              teacherCode: true
            }
          },
          schedules: true,
          _count: {
            select: {
              enrollments: true,
              sessions: true,
              assignments: true,
              materials: true,
              posts: true
            }
          }
        }
      }
    },
    orderBy: {
      enrollmentDate: 'desc'
    }
  });

  return enrollments
    .map((enrollment) => {
      const cls = enrollment.class;
      if (!cls) return null;
      return {
        id: cls.id,
        classCode: cls.classCode,
        name: cls.name,
        status: cls.status,
        startDate: cls.startDate,
        expectedEndDate: cls.expectedEndDate,
        createdAt: cls.createdAt,
        subject: cls.subject ? {
          id: cls.subject.id,
          name: cls.subject.name,
          code: cls.subject.code
        } : null,
        teacher: cls.teacher,
        schedules: cls.schedules,
        counts: {
          enrollments: cls._count?.enrollments || 0,
          sessions: cls._count?.sessions || 0,
          assignments: cls._count?.assignments || 0,
          materials: cls._count?.materials || 0,
          posts: cls._count?.posts || 0
        },
        enrollmentDate: enrollment.enrollmentDate
      };
    })
    .filter(Boolean);
};

// Học sinh xem lịch học cá nhân tổng hợp từ tất cả lớp đã ghi danh
export const getMySchedule = async (studentId, startDateStr, endDateStr, classId = null) => {
  const start = startDateStr ? new Date(startDateStr) : null;
  const end = endDateStr ? new Date(endDateStr) : null;

  if (startDateStr && isNaN(start?.getTime())) {
    throw new AppError('Ngày bắt đầu không hợp lệ', 400);
  }
  if (endDateStr && isNaN(end?.getTime())) {
    throw new AppError('Ngày kết thúc không hợp lệ', 400);
  }

  const enrollmentWhere = {
    studentId,
    isActive: true
  };
  if (classId) {
    enrollmentWhere.classId = classId;
  }

  const enrollments = await prisma.classEnrollment.findMany({
    where: enrollmentWhere,
    select: {
      classId: true
    }
  });

  const classIds = enrollments.map((item) => item.classId);
  if (classIds.length === 0) return [];

  const sessionWhere = {
    classId: { in: classIds }
  };
  if (start) sessionWhere.date = { ...(sessionWhere.date || {}), gte: start };
  if (end) sessionWhere.date = { ...(sessionWhere.date || {}), lte: end };

  const sessions = await prisma.session.findMany({
    where: sessionWhere,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
          status: true
        }
      },
      attendances: {
        where: {
          studentId
        },
        select: {
          status: true
        }
      },
      feedbacks: {
        where: {
          studentId
        },
        select: {
          id: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return sessions.map((session) => ({
    sessionId: session.id,
    classId: session.classId,
    className: session.class.name,
    classCode: session.class.classCode,
    title: session.title || 'Buổi học',
    date: session.date,
    status: session.status,
    attendanceStatus: session.attendances[0]?.status || null,
    hasAttendance: session.attendances.length > 0,
    hasFeedback: session.feedbacks.length > 0
  }));
};

export const getClassMembersForStudent = async (classId, studentId, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 100;
  const search = options.search || '';
  const skip = (page - 1) * limit;

  const isEnrolled = await prisma.classEnrollment.findFirst({
    where: { classId, studentId, isActive: true }
  });

  if (!isEnrolled) {
    throw new AppError('Bạn không có quyền truy cập danh sách thành viên lớp này', 403);
  }

  const where = {
    classId,
    isActive: true,
  };

  if (search) {
    where.student = {
      fullName: { contains: search, mode: 'insensitive' }
    };
  }

  const totalItems = await prisma.classEnrollment.count({ where });
  const enrollments = await prisma.classEnrollment.findMany({
    where,
    include: {
      student: {
        include: {
          account: {
            select: {
              avatarUrl: true
            }
          }
        }
      }
    },
    skip,
    take: limit
  });

  const items = enrollments.map(e => {
    const student = e.student;
    const isSelf = student.id === studentId;
    return {
      id: student.id,
      fullName: student.fullName,
      studentCode: isSelf ? student.studentCode : undefined,
      parentPhone: isSelf ? student.parentPhone : undefined,
      account: {
        avatarUrl: student.account?.avatarUrl || null
      }
    };
  });

  return {
    items,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit
    }
  };
};

export const bulkCreateAndEnrollStudents = async (classId, teacherId, studentsData) => {
  // 1. Kiểm tra lớp học thuộc quyền giáo viên
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!targetClass) {
    throw new AppError('Không tìm thấy lớp học hoặc bạn không có quyền sở hữu lớp học này', 404);
  }

  // 2. Chạy transaction để tạo hàng loạt tài khoản
  return await prisma.$transaction(async (tx) => {
    const createdStudents = [];

    for (const studentData of studentsData) {
      // 2.1 Kiểm tra trùng lặp theo Email cá nhân (nếu được cung cấp)
      if (studentData.email) {
        const existingAccount = await tx.account.findUnique({
          where: { email: studentData.email },
          include: { studentProfile: true }
        });

        if (existingAccount && existingAccount.studentProfile) {
          const studentId = existingAccount.id;
          
          // Ghi danh vào lớp học nếu chưa có
          const existingEnrollment = await tx.classEnrollment.findFirst({
            where: { classId, studentId }
          });
          if (!existingEnrollment) {
            await tx.classEnrollment.create({
              data: { classId, studentId, isActive: true }
            });
          }
          createdStudents.push(existingAccount.studentProfile);
          continue; // Bỏ qua tạo tài khoản mới, tiếp tục vòng lặp
        }
      }

      // 2.2 Kiểm tra trùng lặp theo Họ tên + Ngày sinh + Số điện thoại phụ huynh
      const existingStudent = await tx.student.findFirst({
        where: {
          fullName: studentData.fullName,
          dateOfBirth: new Date(studentData.dateOfBirth),
          parentPhone: studentData.parentPhone
        }
      });

      if (existingStudent) {
        const studentId = existingStudent.id;
        
        // Ghi danh vào lớp học nếu chưa có
        const existingEnrollment = await tx.classEnrollment.findFirst({
          where: { classId, studentId }
        });
        if (!existingEnrollment) {
          await tx.classEnrollment.create({
            data: { classId, studentId, isActive: true }
          });
        }
        createdStudents.push(existingStudent);
        continue; // Bỏ qua tạo tài khoản mới, tiếp tục vòng lặp
      }

      const studentCode = await generateStudentCode(tx);
      const email = studentData.email || `${studentCode.toLowerCase()}@owly.vn`;
      const password = 'Owly@123456'; // Mật khẩu mặc định

      // 3. Tạo tài khoản trong Supabase Auth bằng Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'student',
          full_name: studentData.fullName
        }
      });

      if (authError) {
        throw new AppError(`Lỗi khởi tạo tài khoản ${studentData.fullName} trên Auth Server: ${authError.message}`, 500);
      }

      const studentId = authData.user.id;

      // 4. Tạo Account cục bộ
      await tx.account.create({
        data: {
          id: studentId,
          email,
          phone: studentData.phone || null,
          passwordHash: 'EXTERNAL_SUPABASE_AUTH',
          isActive: true
        }
      });

      // 5. Tạo Student cục bộ
      const student = await tx.student.create({
        data: {
          id: studentId,
          studentCode,
          fullName: studentData.fullName,
          dateOfBirth: new Date(studentData.dateOfBirth),
          parentPhone: studentData.parentPhone,
          createdById: teacherId
        }
      });

      // 6. Ghi danh học viên vào lớp học hiện tại
      await tx.classEnrollment.create({
        data: {
          classId,
          studentId,
          isActive: true
        }
      });

      createdStudents.push(student);
    }

    return createdStudents;
  });
};

