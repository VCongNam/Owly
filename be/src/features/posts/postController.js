import { prisma } from '../../config/db.js';
import { uploadFileToR2, deleteFileFromR2 } from '../../services/r2.service.js';
import { R2_CONFIG } from '../../config/r2.js';
import { createPostSchema, createCommentSchema } from './postSchema.js';

// Helper: Kiểm tra thành viên lớp học (Học sinh có ghi danh hay Giáo viên của lớp)
const verifyClassMember = async (classId, userId) => {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      enrollments: {
        where: { studentId: userId, isActive: true }
      }
    }
  });
  if (!cls) return { exists: false };
  const isTeacher = cls.teacherId === userId;
  const isStudent = cls.enrollments.length > 0;
  return { exists: true, isTeacher, isStudent, teacherId: cls.teacherId };
};

// UC-41: Đăng thông báo mới (Chỉ Giáo viên của lớp)
export const createPost = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const files = req.files || [];

    // 1. Kiểm tra lớp và quyền sở hữu (chỉ giáo viên của lớp được đăng thông báo)
    const { exists, isTeacher } = await verifyClassMember(classId, userId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    }
    if (!isTeacher) {
      return res.status(403).json({ success: false, message: 'Chỉ giáo viên của lớp mới được đăng thông báo.' });
    }

    // 2. Validate nội dung
    const validatedData = createPostSchema.parse(req.body);

    // 3. Upload các file đính kèm lên Cloudflare R2
    const attachments = [];
    if (files.length > 0) {
      await Promise.all(files.map(async (file) => {
        const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `posts/${classId}/${Date.now()}-${cleanOriginalName}`;
        const fileUrl = await uploadFileToR2(file.buffer, fileName, file.mimetype);
        attachments.push(fileUrl);
      }));
    }

    // 4. Lưu bài đăng vào DB
    const post = await prisma.post.create({
      data: {
        classId,
        authorId: userId,
        content: validatedData.content,
        attachments,
        commentsEnabled: true
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            teacherProfile: { select: { fullName: true } },
            studentProfile: { select: { fullName: true } }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng thông báo thành công.',
      data: post
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: error.errors.map(err => err.message)
      });
    }
    next(error);
  }
};

// UC-44: Lấy danh sách bài đăng của lớp (Phân trang)
export const getClassPosts = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    // 1. Xác thực thành viên
    const { exists, isTeacher, isStudent } = await verifyClassMember(classId, userId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    }
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin lớp học này.' });
    }

    // 2. Phân trang
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const totalItems = await prisma.post.count({ where: { classId } });
    const items = await prisma.post.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            teacherProfile: { select: { fullName: true } },
            studentProfile: { select: { fullName: true } }
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Xem chi tiết bài viết (Đồng thời tăng lượt xem - Views)
export const getPostDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Tìm bài viết và thông tin lớp
    const post = await prisma.post.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài đăng không tồn tại.' });
    }

    // 2. Xác thực thành viên
    const { isTeacher, isStudent } = await verifyClassMember(post.classId, userId);
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập bài đăng này.' });
    }

    // 3. Tăng số lượt xem (views) và lấy chi tiết cùng các bình luận
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            teacherProfile: { select: { fullName: true } },
            studentProfile: { select: { fullName: true } }
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                avatarUrl: true,
                teacherProfile: { select: { fullName: true } },
                studentProfile: { select: { fullName: true } }
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedPost
    });

  } catch (error) {
    next(error);
  }
};

// Bật/Tắt tính năng bình luận của bài viết (Chỉ Giáo viên của lớp)
export const toggleComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài đăng không tồn tại.' });
    }

    if (post.class.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'Chỉ giáo viên của lớp mới được bật/tắt bình luận bài đăng.' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { commentsEnabled: !post.commentsEnabled },
      select: { id: true, commentsEnabled: true }
    });

    return res.status(200).json({
      success: true,
      message: updatedPost.commentsEnabled ? 'Đã cho phép bình luận bài viết.' : 'Đã khóa bình luận bài viết.',
      data: updatedPost
    });

  } catch (error) {
    next(error);
  }
};

// UC-45: Xóa thông báo (Chỉ Giáo viên của lớp)
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài đăng không tồn tại.' });
    }

    if (post.class.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài đăng này.' });
    }

    // Xóa file đính kèm trên Cloudflare R2
    const publicUrl = R2_CONFIG.publicUrl;
    if (post.attachments && post.attachments.length > 0) {
      await Promise.all(post.attachments.map(async (url) => {
        let fileKey = url;
        if (publicUrl && fileKey.startsWith(publicUrl)) {
          fileKey = fileKey.replace(publicUrl, '');
          if (fileKey.startsWith('/')) {
            fileKey = fileKey.substring(1);
          }
        }
        try {
          await deleteFileFromR2(fileKey);
        } catch (r2Error) {
          console.error(`Không thể xóa file R2: ${fileKey}`, r2Error);
        }
      }));
    }

    // Xóa khỏi DB
    await prisma.post.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Xóa bài đăng thành công.'
    });

  } catch (error) {
    next(error);
  }
};

// UC-43: Bình luận bài viết (Cả giáo viên & học sinh trong lớp)
export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 1. Kiểm tra bài viết
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { class: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài đăng không tồn tại.' });
    }

    // 2. Kiểm tra quyền thành viên
    const { isTeacher, isStudent } = await verifyClassMember(post.classId, userId);
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập bài viết này.' });
    }

    // 3. Kiểm tra bài viết có mở bình luận không
    if (!post.commentsEnabled) {
      return res.status(400).json({ success: false, message: 'Tính năng bình luận của bài viết này đã bị khóa bởi giáo viên.' });
    }

    // 4. Validate
    const validatedData = createCommentSchema.parse(req.body);

    // 5. Lưu vào DB
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: validatedData.content
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            teacherProfile: { select: { fullName: true } },
            studentProfile: { select: { fullName: true } }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng bình luận thành công.',
      data: comment
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: error.errors.map(err => err.message)
      });
    }
    next(error);
  }
};

// Xóa bình luận (Tác giả bình luận hoặc Giáo viên của lớp)
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          include: { class: true }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Bình luận không tồn tại.' });
    }

    const isAuthor = comment.authorId === userId;
    const isTeacher = comment.post.class.teacherId === userId;

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này.' });
    }

    await prisma.comment.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Xóa bình luận thành công.'
    });

  } catch (error) {
    next(error);
  }
};

// Lấy danh sách bài tập sắp đến hạn (Dành cho sidebar bên trái)
export const getUpcomingAssignments = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    // 1. Xác thực thành viên
    const { exists, isTeacher, isStudent } = await verifyClassMember(classId, userId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    }
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập thông tin lớp này.' });
    }

    const now = new Date();

    const assignments = await prisma.assignment.findMany({
      where: {
        classId,
        dueDate: {
          gt: now
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    });

    return res.status(200).json({
      success: true,
      data: assignments
    });

  } catch (error) {
    next(error);
  }
};
