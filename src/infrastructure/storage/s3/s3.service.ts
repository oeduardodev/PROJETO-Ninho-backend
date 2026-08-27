import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client;
  private bucket: string;
  public publicUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new S3Client({
      endpoint: this.configService.get<string>('storage.s3.endpoint'),
      region: this.configService.get<string>('storage.s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('storage.s3.credentials.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('storage.s3.credentials.secretAccessKey')!,
      },
      forcePathStyle: this.configService.get<boolean>('storage.s3.forcePathStyle'),
    });

    this.bucket = this.configService.get<string>('storage.s3.bucket')!;
    this.publicUrl = this.configService.get<string>('storage.s3.publicUrl')!;

    this.logger.log('✅ S3 client initialized');
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | ReadableStream,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body as Buffer,
        ContentType: contentType,
        Metadata: metadata,
      }),
    );
  }

  async getFile(key: string): Promise<{ body: ReadableStream; contentType: string; contentLength: number }> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return {
      body: response.Body as ReadableStream,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900,
  ): Promise<{ uploadUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    return { uploadUrl, key };
  }

  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async createMultipartUpload(
    key: string,
    contentType: string,
  ): Promise<{ uploadId: string; key: string }> {
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );

    return { uploadId: response.UploadId!, key };
  }

  async getPresignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[],
  ): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );
  }

  generateKey(prefix: string, originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    const uniqueId = randomUUID();
    const timestamp = Date.now();
    return `${prefix}/${timestamp}-${uniqueId}.${ext}`;
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
