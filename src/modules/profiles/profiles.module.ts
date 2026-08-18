import { Module } from '@nestjs/common';
import { ProfilesController } from './presentation/controllers/profiles.controller';
import { ProfilesService } from './application/profiles.service';
import { ProfileRepository } from './domain/ports/profile.repository';
import { PrismaProfileRepository } from './infrastructure/persistence/prisma-profile.repository';
import { StorageModule } from '../../infrastructure/storage/s3/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    { provide: ProfileRepository, useClass: PrismaProfileRepository },
  ],
  exports: [ProfilesService, ProfileRepository],
})
export class ProfilesModule {}