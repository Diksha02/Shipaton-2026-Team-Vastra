import { z } from 'zod';
import { uuidSchema } from '../ids';
import { assetSchema } from './asset';

/**
 * The authenticated user, as the client sees itself.
 *
 * There is no phone number here. We store only `phone_hash` (PROJECT.md §4) —
 * enough to enforce one account per number, not enough to leak a contact list
 * if the database is ever exposed.
 */
export const meSchema = z.object({
  id: uuidSchema,
  handle: z.string(),
  avatar: assetSchema.nullable(),
  /** Timestamp of explicit consent to AI processing of the avatar image.
   *  Null means try-on is unavailable — consent is required, not implied by
   *  having uploaded a photo (F2). */
  avatarConsentAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Me = z.infer<typeof meSchema>;

export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export const updateHandleRequestSchema = z.object({
  handle: z
    .string()
    .toLowerCase()
    .regex(HANDLE_PATTERN, '3–20 characters, lowercase letters, numbers and underscores only'),
});

export type UpdateHandleRequest = z.infer<typeof updateHandleRequestSchema>;

/**
 * Avatar consent is granted and revoked explicitly, and the avatar is deletable
 * on its own without deleting the account (F2).
 */
export const setAvatarConsentRequestSchema = z.object({
  consent: z.boolean(),
});

export type SetAvatarConsentRequest = z.infer<typeof setAvatarConsentRequestSchema>;

/**
 * Account deletion (F13). Required by both stores and by UK GDPR Art. 17.
 *
 * Deletion is a hard delete of user rows, not a soft delete — `deleted_at` is
 * for user-initiated removal of individual items, not for pretending an account
 * is gone while retaining it.
 */
export const deleteAccountRequestSchema = z.object({
  /** Typed confirmation, to make an irreversible action deliberate. */
  confirmation: z.literal('DELETE'),
});

export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;
