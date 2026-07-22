import { uploadFileToR2, deleteFileFromR2 } from '../../services/r2.service.js';
import * as assignmentService from './assignmentService.js';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/db.js';
import { R2_CONFIG } from '../../config/r2.js';

export const createAssignment = async (req, res, next) => {
  try {
    const data = req.body;
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
    const { page, limit } = req.query;
    const result = await assignmentService.getAssignmentsByClassId(classId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const assignment = await assignmentService.updateAssignment(id, data);
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
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

export const uploadFiles = async (req, res, next) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) throw new Error('Không tìm thấy file');

    const attachmentUrls = [];
    for (const file of files) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `assignments/${uuidv4()}.${fileExt}`;
      const url = await uploadFileToR2(file.buffer, fileName, file.mimetype);
      attachmentUrls.push(url);
    }

    res.status(200).json({ success: true, data: { attachmentUrls } });
  } catch (error) {
    next(error);
  }
};

export const createFileFromEditor = async (req, res, next) => {
  try {
    const { htmlContent } = req.body;
    if (!htmlContent) throw new Error('Nội dung không được để trống');

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
