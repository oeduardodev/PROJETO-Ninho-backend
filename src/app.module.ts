import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import appConfig from "./config/app.config";
import authConfig from "./config/auth.config";
import databaseConfig from "./config/database.config";
import queueConfig from "./config/queue.config";
import storageConfig from "./config/storage.config";
import { validateEnv } from "./config/env.validation";
import { TelemetryModule } from "./infrastructure/telemetry/telemetry.module";
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
    TelemetryModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
