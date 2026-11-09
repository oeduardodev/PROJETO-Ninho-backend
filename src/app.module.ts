import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";
import databaseConfig from "./config/database.config";
import queueConfig from "./config/queue.config";
import storageConfig from "./config/storage.config";
import { validateEnv } from "./config/env.validation";
import { TelemetryModule } from "./infrastructure/telemetry/telemetry.module";
import { DatabaseModule } from "./infrastructure/database/prisma/database.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { CommunityModule } from "./modules/community/community.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, queueConfig, storageConfig],
      validate: validateEnv,
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule.register({ global: true }),
    DatabaseModule,
    TelemetryModule,
    AuthModule,
    CommunityModule,
    ConversationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
