import { z } from 'zod';
import {
  OUTFIT_MAX_ITEMS,
  OUTFIT_MIN_ITEMS,
  outfitStatusSchema,
  tryonStatusSchema,
} from '../enums';
import { uuidSchema } from '../ids';
import { assetSchema } from './asset';
import { itemSchema } from './item';

export const outfitSchema = z.object({
  id: uuidSchema,
  name: z.string().nullable(),
  status: outfitStatusSchema,
  slotIndex: z.number().int().nonnegative().nullable(),
  items: z.array(itemSchema),
  coverAsset: assetSchema.nullable(),
  /** Present once a try-on has been generated or served from cache. */
  tryon: z
    .object({
      status: tryonStatusSchema,
      asset: assetSchema.nullable(),
    })
    .nullable(),
  finalisedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Outfit = z.infer<typeof outfitSchema>;

const itemIdList = z
  .array(uuidSchema)
  .min(OUTFIT_MIN_ITEMS, `an outfit needs at least ${OUTFIT_MIN_ITEMS} items`)
  .max(OUTFIT_MAX_ITEMS, `an outfit holds at most ${OUTFIT_MAX_ITEMS} items`)
  .refine((ids) => new Set(ids).size === ids.length, 'an item cannot appear twice in an outfit');

export const createOutfitRequestSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  itemIds: itemIdList,
});

export type CreateOutfitRequest = z.infer<typeof createOutfitRequestSchema>;

/**
 * Edits apply to drafts only. A finalised outfit is immutable — the API rejects
 * this with `OUTFIT_FINALISED` (PROJECT.md §4).
 */
export const updateOutfitRequestSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  itemIds: itemIdList.optional(),
});

export type UpdateOutfitRequest = z.infer<typeof updateOutfitRequestSchema>;

/**
 * Finalising consumes a slot and edit-locks the outfit.
 *
 * Deletion stays available forever, on every outfit, finalised or not. That is
 * a UK GDPR Art. 17 requirement, not a product preference (PROJECT.md §4). The
 * scarcity mechanic is the edit-lock; it is never the delete button.
 */
export const finaliseOutfitRequestSchema = z.object({
  outfitId: uuidSchema,
});

export type FinaliseOutfitRequest = z.infer<typeof finaliseOutfitRequestSchema>;

export const slotsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  /** True once every slot is full. The moment this flips is the only moment the
   *  paywall is allowed to appear (PROJECT.md §6). */
  exhausted: z.boolean(),
});

export type SlotsSummary = z.infer<typeof slotsSummarySchema>;
