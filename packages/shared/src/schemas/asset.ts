import { z } from 'zod';
import { assetKindSchema, moderationStatusSchema } from '../enums';
import { uuidSchema } from '../ids';

/** Upload limits (PROJECT.md §5.1). Enforced client-side for a fast failure and
 *  server-side because the client is not trusted. */
export const UPLOAD_MAX_BYTES = 12 * 1024 * 1024; // 12 MB
export const UPLOAD_MAX_EDGE_PX = 4096;

export const UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
] as const;

export const uploadMimeSchema = z.enum(UPLOAD_MIME_TYPES);
export type UploadMime = z.infer<typeof uploadMimeSchema>;

/**
 * Magic-byte prefixes, by mime. PROJECT.md §5.1 is explicit that rejecting on
 * file extension alone is not acceptable — the worker re-checks these against
 * the object actually stored in R2, after upload.
 *
 * HEIC and WebP carry their marker at a byte offset, so each entry declares the
 * offset it applies at rather than assuming zero.
 */
export const MAGIC_BYTES: Readonly<
  Record<UploadMime, ReadonlyArray<{ offset: number; bytes: readonly number[] }>>
> = Object.freeze({
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // 'ftyp' box at offset 4, brand at 8. Covers heic/heix/hevc/mif1.
  'image/heic': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  // 'RIFF' .... 'WEBP'
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
});

// --- requests --------------------------------------------------------------

/** Step 1: ask for a signed PUT URL. The client uploads straight to R2 and the
 *  bytes never pass through our API (PROJECT.md §5.1). */
export const createUploadUrlRequestSchema = z.object({
  kind: assetKindSchema.exclude(['catalogue']),
  mime: uploadMimeSchema,
  bytes: z.number().int().positive().max(UPLOAD_MAX_BYTES),
  /** Client-computed SHA-256 of the file. Lets us short-circuit a re-upload of
   *  something we already hold, and is re-verified server-side. */
  sha256: z.string().regex(/^[a-f0-9]{64}$/, 'must be a lowercase hex sha256'),
});

export type CreateUploadUrlRequest = z.infer<typeof createUploadUrlRequestSchema>;

export const createUploadUrlResponseSchema = z.object({
  assetId: uuidSchema,
  uploadUrl: z.string().url(),
  /** Headers the client must replay exactly, or the signature will not match. */
  requiredHeaders: z.record(z.string()),
  expiresAt: z.string().datetime(),
});

export type CreateUploadUrlResponse = z.infer<typeof createUploadUrlResponseSchema>;

/** Step 2: tell us the upload finished. This is what enqueues verification,
 *  re-encode, moderation and tagging. */
export const confirmUploadRequestSchema = z.object({
  assetId: uuidSchema,
});

export type ConfirmUploadRequest = z.infer<typeof confirmUploadRequestSchema>;

// --- reads -----------------------------------------------------------------

/**
 * The client-facing shape of an asset. Note there is no R2 key: clients receive
 * a resolved URL, and only ever for assets whose moderation status is `pass`.
 */
export const assetSchema = z.object({
  id: uuidSchema,
  kind: assetKindSchema,
  url: z.string().url().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  moderationStatus: moderationStatusSchema,
  createdAt: z.string().datetime(),
});

export type Asset = z.infer<typeof assetSchema>;
