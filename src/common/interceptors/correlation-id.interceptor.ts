import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../infrastructure/telemetry/logger';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      (request.headers['x-correlation-id'] as string) || uuidv4();

    request.correlationId = correlationId;
    request.headers['x-correlation-id'] = correlationId;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        logger.debug(
          { correlationId, duration, path: request.url, method: request.method },
          'Request completed',
        );
      }),
    );
  }
}