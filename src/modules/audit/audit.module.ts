import { Module } from '@nestjs/common';
import { AuditService } from './application/audit.service';
import { AuditRepository } from './domain/ports/audit.repository';
import { PrismaAuditRepository } from './infrastructure/persistence/prisma-audit.repository';

@Module({
  providers: [
    AuditService,
    { provide: AuditRepository, useClass: PrismaAuditRepository },
  ],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}