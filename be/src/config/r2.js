import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const hasMissingCredentials = !accessKeyId || !secretAccessKey || !endpoint || !bucketName;

if (hasMissingCredentials) {
  console.warn('Warning: Cloudflare R2 credentials are not properly set in environment variables. Please check R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET_NAME.');
}

// Khởi tạo S3 Client cho Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 yêu cầu đặt region là auto
  endpoint: endpoint || 'https://placeholder.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: accessKeyId || 'placeholder-access-key',
    secretAccessKey: secretAccessKey || 'placeholder-secret-key',
  },
});

export const R2_CONFIG = {
  bucketName: bucketName || 'placeholder-bucket',
  publicUrl: publicUrl || '',
};
