import { INestApplication } from '@nestjs/common';
import { logger } from '../infrastructure/telemetry/logger';

export function setupHttp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  logger.info('✅ HTTP server configured');
}