import { Module } from '@nestjs/common';
import { UsersController } from './presentation/controllers/users.controller';
import { UsersService } from './application/users.service';
import { UserRepository } from './domain/ports/user.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}