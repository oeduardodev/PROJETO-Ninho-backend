import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { FileStorageService } from './file-storage.service';

@Global()
@Module({
  providers: [S3Service, FileStorageService],
  exports: [S3Service, FileStorageService],
})
export class StorageModule {}