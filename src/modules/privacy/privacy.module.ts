import { Module } from '@nestjs/common';
import { PrivacyController } from './presentation/controllers/privacy.controller';
import { PrivacyService } from './application/privacy.service';
import { PrivacyRepository } from './domain/ports/privacy.repository';
import { PrismaPrivacyRepository } from './infrastructure/persistence/prisma-privacy.repository';
import { QueueModule } from '../../infrastructure/queue/bullmq/queue.module';
import { StorageModule } from '../../infrastructure/storage/s3/storage.module';

@Module({
  imports: [QueueModule, StorageModule],
  controllers: [PrivacyController],
  providers: [
    PrivacyService,
    { provide: PrivacyRepository, useClass: PrismaPrivacyRepository },
  ],
  exports: [PrivacyService, PrivacyRepository],
})
export class PrivacyModule {}