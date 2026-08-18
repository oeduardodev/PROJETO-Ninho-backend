import { Module } from '@nestjs/common';
import { SupportController } from './presentation/controllers/support.controller';
import { SupportService } from './application/support.service';
import { SupportRepository } from './domain/ports/support.repository';
import { PrismaSupportRepository } from './infrastructure/persistence/prisma-support.repository';

@Module({
  controllers: [SupportController],
  providers: [
    SupportService,
    { provide: SupportRepository, useClass: PrismaSupportRepository },
  ],
  exports: [SupportService, SupportRepository],
})
export class SupportModule {}