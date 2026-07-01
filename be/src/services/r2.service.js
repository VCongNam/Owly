import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_CONFIG } from '../config/r2.js';

/**
 * Upload file/buffer lên Cloudflare R2
 * @param {Buffer} fileBuffer - Nội dung file cần upload dưới dạng Buffer
 * @param {string} fileName - Tên file muốn lưu trên bucket (Key)
 * @param {string} mimeType - Định dạng MIME của file (ví dụ: 'image/jpeg', 'image/png')
 * @returns {Promise<string>} Trả về link URL truy cập công khai của file
 */
export const uploadFileToR2 = async (fileBuffer, fileName, mimeType) => {
  if (!fileBuffer || !fileName) {
    throw new Error('Nội dung file (Buffer) và tên file không được để trống.');
  }

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  try {
    await r2Client.send(command);
    
    // Nếu cấu hình R2_PUBLIC_URL thì trả về đường dẫn đầy đủ, ngược lại trả về key
    const baseUrl = R2_CONFIG.publicUrl.endsWith('/') 
      ? R2_CONFIG.publicUrl.slice(0, -1) 
      : R2_CONFIG.publicUrl;
      
    return baseUrl ? `${baseUrl}/${fileName}` : fileName;
  } catch (error) {
    console.error('Lỗi khi upload file lên Cloudflare R2:', error);
    throw error;
  }
};

/**
 * Xóa file trên Cloudflare R2
 * @param {string} fileName - Tên file (Key) cần xóa trên R2
 * @returns {Promise<void>}
 */
export const deleteFileFromR2 = async (fileName) => {
  if (!fileName) {
    throw new Error('Tên file cần xóa không được để trống.');
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: fileName,
  });

  try {
    await r2Client.send(command);
  } catch (error) {
    console.error('Lỗi khi xóa file trên Cloudflare R2:', error);
    throw error;
  }
};
