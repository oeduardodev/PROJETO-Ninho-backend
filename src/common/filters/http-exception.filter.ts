import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../../infrastructure/telemetry/logger";

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers["x-correlation-id"] as string) || randomUUID();
    const timestamp = new Date().toISOString();
    const path = request.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp.code as string) || exception.name;
        const responseMessage = resp.message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join(". ");
          details = { validationErrors: responseMessage };
        } else {
          message = (responseMessage as string) || exception.message;
          details = resp.details as Record<string, unknown> | undefined;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error({ err: exception, correlationId }, "Unhandled error");
      code = "INTERNAL_SERVER_ERROR";
      message = isProduction() ? "Internal server error" : exception.message;
    }

    const errorResponse: ErrorResponse = {
      code,
      message,
      details,
      correlationId,
      timestamp,
      path,
    };

    logger.error(
      { correlationId, code, status, path, method: request.method },
      "HTTP Exception",
    );

    response.status(status).json(errorResponse);
  }
}

function isProduction(): boolean {
  return process.env.APP_ENV === "production";
}
