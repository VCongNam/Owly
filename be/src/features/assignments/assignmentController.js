import { uploadFileToR2, deleteFileFromR2 } from '../../services/r2.service.js';
import * as assignmentService from './assignmentService.js';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/db.js';
import { R2_CONFIG } from '../../config/r2.js';
import { AppError } from '../../utils/appError.js';
import { requireTeacher, requireStudent, assertClassAccess } from '../../utils/authHelpers.js';

export const createAssignment = async (req, res, next) => {
  try {
    requireTeacher(req);
    const data = req.body;
    await assertClassAccess(req.user.id, 'teacher', data.classId);
    const assignment = await assignmentService.createAssignment(data);

    // Tự động đăng bài viết thông báo có bài tập mới lên Bảng tin (Class Stream)
    try {
      const formattedDueDate = new Date(assignment.dueDate).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });
      const postContent = `BÀI TẬP MỚI\n\nGiáo viên vừa giao một bài tập mới: "${assignment.title}".\nHạn nộp: ${formattedDueDate}.\nCác bạn học sinh hãy xem chi tiết và hoàn thành bài tập đúng hạn tại tab "Bài tập" nhé!`;
      
      await prisma.post.create({
        data: {
          classId: assignment.classId,
          authorId: req.user.id,
          content: postContent,
          attachments: assignment.attachmentUrls || [],
          commentsEnabled: true
        }
      });
    } catch (postError) {
      console.error('Lỗi khi tự động đăng bài viết thông báo bài tập mới:', postError);
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const getAssignments = async (req, res, next) => {
  try {
    const { classId } = req.params;
    // Kiểm tra phân quyền: teacher phải sở hữu lớp, student phải có enrollment
    await assertClassAccess(req.user.id, req.user.role, classId);
    // page và limit đã được validate và coerce thành số bởi paginationSchema
    const { page, limit } = req.query;
    const result = await assignmentService.getAssignmentsByClassId(classId, { page, limit });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    requireTeacher(req);
    const { id } = req.params;
    const data = req.body;
    // Kiểm tra bài tập tồn tại và thuộc lớp do giáo viên sở hữu
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { class: { select: { teacherId: true } } }
    });
    if (!assignment) throw new AppError('Bài tập không tồn tại', 404);
    if (assignment.class.teacherId !== req.user.id) {
      throw new AppError('Bạn không có quyền thao tác trên bài tập này', 403);
    }
    const updated = await assignmentService.updateAssignment(id, data);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    requireTeacher(req);
    const { id } = req.params;
    // Kiểm tra bài tập tồn tại và thuộc lớp do giáo viên sở hữu
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { class: { select: { teacherId: true } }, attachmentUrls: true }
    });
    if (!assignment) throw new AppError('Bài tập không tồn tại', 404);
    if (assignment.class.teacherId !== req.user.id) {
      throw new AppError('Bạn không có quyền thao tác trên bài tập này', 403);
    }

    const deletedAssignment = await assignmentService.deleteAssignment(id);

    // Xóa các file đính kèm trên Cloudflare R2
    if (deletedAssignment && deletedAssignment.attachmentUrls && deletedAssignment.attachmentUrls.length > 0) {
      const publicUrl = R2_CONFIG.publicUrl;
      await Promise.all(deletedAssignment.attachmentUrls.map(async (url) => {
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

    res.status(200).json({ success: true, message: 'Đã xóa bài tập' });
  } catch (error) {
    next(error);
  }
};

export const createFileFromEditor = async (req, res, next) => {
  try {
    requireTeacher(req);
    const { htmlContent } = req.body;
    if (!htmlContent) throw new AppError('Nội dung không được để trống', 400);

    const fileName = `assignments/doc-${uuidv4()}.html`;
    const buffer = Buffer.from(htmlContent, 'utf-8');
    
    // HTML wrapper to make it a standalone viewable file
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bài tập</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    const fullBuffer = Buffer.from(fullHtml, 'utf-8');
    const url = await uploadFileToR2(fullBuffer, fileName, 'text/html');

    res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
};

export const getTeacherUpcomingAssignments = async (req, res, next) => {
  try {
    requireTeacher(req);
    const teacherId = req.user.id;
    const { limit } = req.query;
    const assignments = await assignmentService.getTeacherUpcomingAssignments(teacherId, limit);
    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssignment = async (req, res, next) => {
  try {
    requireStudent(req);
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { content } = req.body;

    const submission = await assignmentService.submitAssignment(assignmentId, studentId, content);

    return res.status(201).json({
      success: true,
      message: 'Nộp bài tập thành công',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubmission = async (req, res, next) => {
  try {
    requireStudent(req);
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const submission = await assignmentService.getMySubmission(assignmentId, studentId);

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    requireTeacher(req);
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    const submissions = await assignmentService.getAssignmentSubmissions(assignmentId, teacherId);

    return res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    requireTeacher(req);
    const { submissionId } = req.params;
    const teacherId = req.user.id;
    const { grade, remarks, attachmentUrl } = req.body;

    const feedback = await assignmentService.gradeSubmission(submissionId, teacherId, { grade, remarks, attachmentUrl });

    return res.status(200).json({
      success: true,
      message: 'Chấm điểm bài làm thành công',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

