import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  s3: {
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT!,
    region: process.env.OBJECT_STORAGE_REGION!,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY!,
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY!,
    },
    bucket: process.env.OBJECT_STORAGE_BUCKET!,
    publicUrl: process.env.OBJECT_STORAGE_PUBLIC_URL!,
    forcePathStyle: true,
  },
  upload: {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
    ],
    presignedUrlExpiry: 15 * 60,
  },
  scan: {
    enabled: true,
    timeout: 30000,
  },
  retention: {
    tempFiles: 24 * 60 * 60 * 1000,
    scannedFiles: 30 * 24 * 60 * 60 * 1000,
  },
}));