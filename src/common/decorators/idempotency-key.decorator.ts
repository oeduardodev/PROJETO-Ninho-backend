import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdempotencyKey = createParamDecorator(
  (data: undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['idempotency-key'] as string | undefined;
  },
);