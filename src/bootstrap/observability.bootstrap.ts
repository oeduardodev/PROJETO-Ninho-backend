import { INestApplication } from '@nestjs/common';
import { logger } from '../infrastructure/telemetry/logger';

export function setupObservability(app: INestApplication): void {
  const isProduction = process.env.APP_ENV === 'production';

  if (isProduction) {
    logger.info('🔍 Observability configured for production');
  } else {
    logger.info('🔍 Observability configured for development');
  }

  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated');
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}