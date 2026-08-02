import { z } from 'zod';
import { errorCodeSchema } from './errors';

/**
 * Response envelope (PROJECT.md §7). Every API response is exactly one of these.
 * There is no third shape, and `data` is never null on success — an endpoint
 * with nothing to return sends `{ data: {} }`.
 */

export const apiErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  /** Field-level detail for VALIDATION_FAILED. Never contains secrets or raw
   *  provider payloads — those stay in logs. */
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiFailureSchema = z.object({ error: apiErrorSchema });
export type ApiFailure = z.infer<typeof apiFailureSchema>;

export function apiSuccessSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data });
}

export type ApiSuccess<T> = { data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function isApiFailure<T>(response: ApiResponse<T>): response is ApiFailure {
  return 'error' in response;
}

/** Cursor pagination. Offset pagination is wrong for a wardrobe that grows while
 *  you scroll it; uuid v7 ids are time-sortable, so the cursor is just an id. */
export const pageParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(24),
});

export type PageParams = z.infer<typeof pageParamsSchema>;

export function pagedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export type Paged<T> = { items: T[]; nextCursor: string | null };
