import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../../utils/s3Client.js';
import * as assignmentService from './assignmentService.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to upload buffer to R2
const uploadToR2 = async (buffer, fileName, contentType) => {
  if (!R2_BUCKET_NAME) throw new Error('Cloudflare R2 is not configured properly.');

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `${R2_PUBLIC_URL}/${fileName}`;
};

export const createAssignment = async (req, res, next) => {
  try {
    const data = req.body;
    const assignment = await assignmentService.createAssignment(data);
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
    await assignmentService.deleteAssignment(id);
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
      const url = await uploadToR2(file.buffer, fileName, file.mimetype);
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
    const url = await uploadToR2(fullBuffer, fileName, 'text/html');

    res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
};
