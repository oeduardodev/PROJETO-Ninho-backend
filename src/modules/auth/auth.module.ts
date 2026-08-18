import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { LocalStrategy } from './infrastructure/auth/local.strategy';
import { SessionRepository } from './infrastructure/persistence/session.repository';
import { PrismaSessionRepository } from './infrastructure/persistence/prisma-session.repository';
import { UserModule } from '../users/users.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.accessSecret'),
        signOptions: { expiresIn: configService.get<string>('auth.jwt.accessExpiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    { provide: SessionRepository, useClass: PrismaSessionRepository },
  ],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}