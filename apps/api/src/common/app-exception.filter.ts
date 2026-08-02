import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, Logger } from '@nestjs/common';
import { AppError, ERROR_HTTP_STATUS, type ErrorCode } from '@vastra/shared';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * The single place an error response is constructed (PROJECT.md §7).
 *
 * Three rules:
 *   - clients switch on `code`, never on `message`;
 *   - an unrecognised throwable becomes INTERNAL, and its real content goes to
 *     the log, not to the client — internal messages leak schema and file paths;
 *   - 5xx is logged with a stack, 4xx is not. A client mistake is not an
 *     operational event and should not page anyone.
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const { status, body } = this.describe(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status} ${body.error.code}`);
    }

    response.status(status).json(body);
  }

  private describe(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      return {
        status: exception.status,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.details === undefined ? {} : { details: exception.details }),
          },
        },
      };
    }

    if (exception instanceof ZodError) {
      return {
        status: ERROR_HTTP_STATUS.VALIDATION_FAILED,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Request failed validation.',
            details: exception.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: {
          error: {
            code: status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL',
            message: exception.message,
          },
        },
      };
    }

    return {
      status: ERROR_HTTP_STATUS.INTERNAL,
      body: {
        error: { code: 'INTERNAL', message: 'Something went wrong.' },
      },
    };
  }
}
