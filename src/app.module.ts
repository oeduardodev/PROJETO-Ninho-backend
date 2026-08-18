import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { queueConfig } from './config/queue.config';
import { storageConfig } from './config/storage.config';
import { validateEnv } from './config/env.validation';

import { DatabaseModule } from './infrastructure/database/prisma/database.module';
import { CacheModule } from './infrastructure/cache/redis/cache.module';
import { QueueModule } from './infrastructure/queue/bullmq/queue.module';
import { StorageModule } from './infrastructure/storage/s3/storage.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { PushModule } from './infrastructure/push/push.module';
import { TelemetryModule } from './infrastructure/telemetry/telemetry.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { CommunityModule } from './modules/community/community.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SupportModule } from './modules/support/support.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, queueConfig, storageConfig],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    CacheModule,
    QueueModule,
    StorageModule,
    MailModule,
    PushModule,
    TelemetryModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ProfessionalsModule,
    CommunityModule,
    ConversationsModule,
    ModerationModule,
    ReportsModule,
    SupportModule,
    NotificationsModule,
    PrivacyModule,
    AuditModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}