import { z } from 'zod';

/**
 * Shared error codes (PROJECT.md §7). The API returns `{ error: { code, message } }`
 * and the client switches on `code`, never on `message`. Messages are for humans
 * and may be reworded freely; codes are a contract and may not.
 */
export const ERROR_CODES = [
  // auth
  'UNAUTHENTICATED',
  'FORBIDDEN',

  // generic
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL',

  // assets / upload
  'ASSET_TOO_LARGE',
  'ASSET_UNSUPPORTED_TYPE',
  'ASSET_MIME_MISMATCH',
  'ASSET_NOT_READY',
  'MODERATION_REJECTED',
  'MODERATION_PENDING',

  // outfits / slots
  'OUTFIT_TOO_FEW_ITEMS',
  'OUTFIT_TOO_MANY_ITEMS',
  'OUTFIT_FINALISED',
  'NO_SLOTS_AVAILABLE',

  // try-on
  'TRYON_DISABLED',
  'TRYON_NO_AVATAR',
  'TRYON_NO_CONSENT',
  'TRYON_FAILED',

  // url ingestion
  'INGEST_DISABLED',
  'INGEST_UNREADABLE',
  'INGEST_BLOCKED_HOST',
  'INGEST_TOO_LARGE',
  'INGEST_TIMEOUT',

  // billing
  'PURCHASE_VERIFICATION_FAILED',
  'WEBHOOK_SIGNATURE_INVALID',

  // providers
  'PROVIDER_UNAVAILABLE',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Default HTTP status per code, so a handler never has to remember one. */
export const ERROR_HTTP_STATUS: Readonly<Record<ErrorCode, number>> = Object.freeze({
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,

  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,

  ASSET_TOO_LARGE: 413,
  ASSET_UNSUPPORTED_TYPE: 415,
  ASSET_MIME_MISMATCH: 422,
  ASSET_NOT_READY: 409,
  MODERATION_REJECTED: 422,
  MODERATION_PENDING: 409,

  OUTFIT_TOO_FEW_ITEMS: 422,
  OUTFIT_TOO_MANY_ITEMS: 422,
  OUTFIT_FINALISED: 409,
  NO_SLOTS_AVAILABLE: 402,

  TRYON_DISABLED: 503,
  TRYON_NO_AVATAR: 409,
  TRYON_NO_CONSENT: 403,
  TRYON_FAILED: 502,

  INGEST_DISABLED: 503,
  INGEST_UNREADABLE: 422,
  INGEST_BLOCKED_HOST: 400,
  INGEST_TOO_LARGE: 413,
  INGEST_TIMEOUT: 504,

  PURCHASE_VERIFICATION_FAILED: 402,
  WEBHOOK_SIGNATURE_INVALID: 401,

  PROVIDER_UNAVAILABLE: 503,
});

/**
 * The one error type thrown inside the API. A NestJS filter maps it to the
 * response envelope; nothing else constructs an error response by hand.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_HTTP_STATUS[code];
    this.details = details;
  }
}
