import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

export interface UploadIntent {
  key: string;
  uploadUrl: string;
  expiresAt: Date;
  maxSize: number;
  allowedMimeTypes: string[];
}

export interface FileMetadata {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  uploadedAt: Date;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  constructor(
    private s3: S3Service,
    private configService: ConfigService,
  ) {}

  async createUploadIntent(
    prefix: string,
    originalName: string,
    mimeType: string,
    _purpose: 'avatar' | 'attachment' | 'report' | 'profile' = 'attachment',
  ): Promise<UploadIntent> {
    const allowedMimeTypes = this.configService.get<string[]>('storage.upload.allowedMimeTypes')!;
    const maxSize = this.configService.get<number>('storage.upload.maxSize')!;
    const expiresIn = this.configService.get<number>('storage.upload.presignedUrlExpiry')!;

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} not allowed`);
    }

    const key = this.s3.generateKey(prefix, originalName);
    const { uploadUrl } = await this.s3.getPresignedUploadUrl(key, mimeType, expiresIn);

    return {
      key,
      uploadUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      maxSize,
      allowedMimeTypes,
    };
  }

  async confirmUpload(key: string, expectedSize?: number): Promise<FileMetadata> {
    const exists = await this.s3.fileExists(key);
    if (!exists) {
      throw new BadRequestException('File not found after upload');
    }

    return {
      key,
      originalName: key.split('/').pop() || '',
      mimeType: 'application/octet-stream',
      size: expectedSize || 0,
      scanStatus: 'pending',
      uploadedAt: new Date(),
    };
  }

  async markScanned(key: string, status: 'clean' | 'infected'): Promise<void> {
    this.logger.log({ key, status }, 'File scan completed');
  }

  async getDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    return this.s3.getPresignedDownloadUrl(key, expiresIn);
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteFile(key);
  }

  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    this.logger.log({ olderThanHours }, 'Cleaning up temp files');
    return 0;
  }
}
