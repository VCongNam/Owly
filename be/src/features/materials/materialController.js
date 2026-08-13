import { prisma } from '../../config/db.js';
import { uploadFileToR2, deleteFileFromR2 } from '../../services/r2.service.js';
import { R2_CONFIG } from '../../config/r2.js';
import { createMaterialSchema } from './materialSchema.js';
import { AppError } from '../../utils/appError.js';
import { assertClassAccess } from '../../utils/authHelpers.js';

// UC: Tải lên tài liệu học tập (Chỉ Giáo viên của lớp - Hỗ trợ tải lên nhiều file)
export const uploadMaterial = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const files = req.files;

    // 1. Kiểm tra tài khoản có phải giáo viên và sở hữu lớp học này không
    await assertClassAccess(userId, userRole, classId);

    if (userRole !== 'teacher') {
      throw new AppError('Bạn không có quyền tải lên tài liệu cho lớp học này.', 403);
    }

    // 2. Validate files
    if (!files || files.length === 0) {
      throw new AppError('Vui lòng chọn ít nhất một tài liệu để tải lên.', 400);
    }

    // 3. Validate body (title, description)
    const validatedData = createMaterialSchema.parse(req.body);

    const uploadedMaterials = [];

    // 4. Duyệt qua từng file và upload song song
    await Promise.all(files.map(async (file) => {
      // Định nghĩa đường dẫn và tên file trên R2
      const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `materials/${classId}/${Date.now()}-${cleanOriginalName}`;

      // Upload lên Cloudflare R2
      const fileUrl = await uploadFileToR2(file.buffer, fileName, file.mimetype);

      // Nếu tải lên 1 file và có nhập tiêu đề tùy chọn -> Dùng tiêu đề đó.
      // Nếu tải lên nhiều file hoặc không nhập tiêu đề -> Dùng tên gốc của file làm tiêu đề hiển thị (bỏ phần đuôi mở rộng).
      const displayTitle = (files.length === 1 && validatedData.title)
        ? validatedData.title
        : file.originalname.replace(/\.[^/.]+$/, "");

      // Lưu metadata vào PostgreSQL qua Prisma
      const material = await prisma.classMaterial.create({
        data: {
          classId,
          title: displayTitle,
          description: validatedData.description || null,
          fileUrl,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size
        }
      });
      uploadedMaterials.push(material);
    }));

    // 5. Tự động đăng bài viết thông báo có tài liệu mới lên Bảng tin (Class Stream)
    try {
      const materialTitles = uploadedMaterials.map(m => `"${m.title}"`).join(', ');
      const postContent = `TÀI LIỆU HỌC TẬP MỚI\n\nGiáo viên vừa tải lên tài liệu mới cho lớp học: ${materialTitles}.\nCác bạn học sinh hãy xem chi tiết và tải xuống tài liệu ở danh sách đính kèm bên dưới hoặc tại tab "Học liệu" nhé!`;
      const attachments = uploadedMaterials.map(m => m.fileUrl);

      await prisma.post.create({
        data: {
          classId,
          authorId: userId,
          content: postContent,
          attachments,
          commentsEnabled: true
        }
      });
    } catch (postError) {
      console.error('Lỗi khi tự động đăng bài viết thông báo học liệu mới:', postError);
    }

    return res.status(201).json({
      success: true,
      message: `Tải lên thành công ${files.length} tài liệu.`,
      data: uploadedMaterials
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      const appErr = new AppError('Dữ liệu không hợp lệ.', 400);
      appErr.errors = error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(appErr);
    }
    next(error);
  }
};

// UC: Lấy danh sách tài liệu học tập của lớp học (Phân trang, Giáo viên hoặc Học viên trong lớp)
export const getClassMaterials = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Kiểm tra quyền truy cập: giáo viên dạy lớp hoặc học viên trong lớp
    await assertClassAccess(userId, userRole, classId);

    // 3. Phân trang
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.classMaterial.count({
      where: { classId }
    });

    const items = await prisma.classMaterial.findMany({
      where: { classId },
      orderBy: { uploadedAt: 'desc' },
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

// UC: Xóa tài liệu học tập (Chỉ Giáo viên của lớp)
export const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Tìm tài liệu
    const material = await prisma.classMaterial.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!material) {
      throw new AppError('Tài liệu không tồn tại.', 404);
    }

    // 2. Kiểm tra quyền truy cập lớp và vai trò giáo viên
    await assertClassAccess(userId, userRole, material.classId);

    if (material.class.teacherId !== userId) {
      throw new AppError('Bạn không có quyền xóa tài liệu của lớp học này.', 403);
    }

    // 3. Xóa file vật lý trên Cloudflare R2
    const publicUrl = R2_CONFIG.publicUrl;
    let fileKey = material.fileUrl;
    if (publicUrl && fileKey.startsWith(publicUrl)) {
      fileKey = fileKey.replace(publicUrl, '');
      if (fileKey.startsWith('/')) {
        fileKey = fileKey.substring(1);
      }
    }

    try {
      await deleteFileFromR2(fileKey);
    } catch (r2Error) {
      console.error('Không thể xóa file trên R2:', r2Error);
      // Tiếp tục xóa trong database kể cả khi file R2 gặp lỗi (tránh kẹt DB)
    }

    // 4. Xóa khỏi database
    await prisma.classMaterial.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa tài liệu thành công.'
    });

  } catch (error) {
    next(error);
  }
};
