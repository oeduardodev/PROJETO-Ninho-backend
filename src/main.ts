import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupObservability } from './bootstrap/observability.bootstrap';
import { setupHttp } from './bootstrap/http.bootstrap';
import { setupWebSocket } from './bootstrap/websocket.bootstrap';
import { logger } from './infrastructure/telemetry/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bufferLogs: true,
  });

  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || '/api';
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion.replace('v', ''),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: { target: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new TransformInterceptor(),
  );

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ninho API')
    .setDescription('API for Ninho community platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Auth endpoints')
    .addTag('Users', 'User management')
    .addTag('Profiles', 'Public profiles')
    .addTag('Community', 'Posts and interactions')
    .addTag('Conversations', 'Real-time messaging')
    .addTag('Moderation', 'Content moderation')
    .addTag('Reports', 'User reports')
    .addTag('Support', 'Help and resources')
    .addTag('Notifications', 'Push and email notifications')
    .addTag('Privacy', 'Data privacy and rights')
    .addTag('Admin', 'Administrative operations')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  setupHttp(app);
  setupWebSocket(app);
  setupObservability(app);

  await app.listen(port);
  logger.info(`🚀 Application running on port ${port}`);
  logger.info(`📚 Swagger docs available at ${apiPrefix}/docs`);
}

bootstrap();