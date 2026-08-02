import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps every successful response in `{ data }` (PROJECT.md §7).
 *
 * Applied globally so a controller returns a plain value and cannot forget the
 * envelope. Failures are handled by AppExceptionFilter, which produces the
 * `{ error }` half.
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<{ data: unknown }> {
    return next.handle().pipe(
      map((data: unknown) => ({
        // An endpoint with nothing to say still sends an object, never null —
        // clients destructure `data` unconditionally.
        data: data ?? {},
      })),
    );
  }
}
