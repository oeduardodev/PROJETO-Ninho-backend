import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';

export interface ApiResponse<T> {
  data: T;
  meta: {
    correlationId: string;
    timestamp: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      (request.headers['x-correlation-id'] as string) || randomUUID();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          correlationId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
