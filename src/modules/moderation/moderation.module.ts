import { Module } from '@nestjs/common';
import { ModerationController } from './presentation/controllers/moderation.controller';
import { ModerationService } from './application/moderation.service';
import { ModerationRepository } from './domain/ports/moderation.repository';
import { PrismaModerationRepository } from './infrastructure/persistence/prisma-moderation.repository';

@Module({
  controllers: [ModerationController],
  providers: [
    ModerationService,
    { provide: ModerationRepository, useClass: PrismaModerationRepository },
  ],
  exports: [ModerationService, ModerationRepository],
})
export class ModerationModule {}