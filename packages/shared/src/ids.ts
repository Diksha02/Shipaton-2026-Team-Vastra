import { v7 as uuidv7Impl, validate as uuidValidate } from 'uuid';
import { z } from 'zod';

/**
 * All ids in this system are UUID v7 (PROJECT.md §4).
 *
 * v7 embeds a millisecond timestamp in the high bits, so ids sort
 * chronologically. That gives us index locality on insert and lets us order by
 * primary key instead of carrying a separate `created_at` index everywhere.
 *
 * Postgres 16 has no native `uuidv7()` — that landed in 18 — so ids are
 * generated in application code, never by a column default.
 */
export function newId(): string {
  return uuidv7Impl();
}

/** Accepts any syntactically valid UUID. Version is not enforced at the boundary:
 *  rejecting a v4 id we ourselves issued during an earlier migration would be a
 *  worse failure than accepting one. */
export const uuidSchema = z.string().refine(uuidValidate, {
  message: 'must be a valid UUID',
});

export type Uuid = z.infer<typeof uuidSchema>;
