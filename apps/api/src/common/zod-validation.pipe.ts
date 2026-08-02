import type { PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates a payload against a zod schema at the boundary (PROJECT.md §7).
 *
 * The ZodError it throws is turned into a VALIDATION_FAILED envelope by
 * AppExceptionFilter, so a controller never handles validation failure itself.
 *
 * Usage: `@Body(new ZodValidationPipe(createOutfitRequestSchema)) body: CreateOutfitRequest`
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    return this.schema.parse(value);
  }
}
