import { Module } from '@nestjs/common';
import { ProfessionalsController } from './presentation/controllers/professionals.controller';
import { ProfessionalsService } from './application/professionals.service';
import { ProfessionalRepository } from './domain/ports/professional.repository';
import { PrismaProfessionalRepository } from './infrastructure/persistence/prisma-professional.repository';
import { StorageModule } from '../../infrastructure/storage/s3/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ProfessionalsController],
  providers: [
    ProfessionalsService,
    { provide: ProfessionalRepository, useClass: PrismaProfessionalRepository },
  ],
  exports: [ProfessionalsService, ProfessionalRepository],
})
export class ProfessionalsModule {}