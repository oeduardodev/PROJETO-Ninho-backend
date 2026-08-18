import { Module } from '@nestjs/common';
import { ReportsController } from './presentation/controllers/reports.controller';
import { ReportsService } from './application/reports.service';
import { ReportRepository } from './domain/ports/report.repository';
import { PrismaReportRepository } from './infrastructure/persistence/prisma-report.repository';
import { StorageModule } from '../../infrastructure/storage/s3/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    { provide: ReportRepository, useClass: PrismaReportRepository },
  ],
  exports: [ReportsService, ReportRepository],
})
export class ReportsModule {}