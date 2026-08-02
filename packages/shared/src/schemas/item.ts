import { z } from 'zod';
import {
  itemCategorySchema,
  itemColourSchema,
  itemSourceSchema,
  taggingStatusSchema,
} from '../enums';
import { uuidSchema } from '../ids';
import { assetSchema } from './asset';

/**
 * A garment. The same table backs user-owned items and catalogue items — they
 * differ by `source` and by whether `ownerUserId` is set (PROJECT.md §4).
 */
export const itemSchema = z.object({
  id: uuidSchema,
  source: itemSourceSchema,
  brand: z.string().nullable(),
  title: z.string(),
  /** Minor units (pence/cents). Never a float — money in a float is a bug
   *  waiting for a rounding edge case. */
  priceMinor: z.number().int().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  productUrl: z.string().url().nullable(),
  primaryAsset: assetSchema.nullable(),
  category: itemCategorySchema,
  subcategory: z.string().nullable(),
  colourPrimary: itemColourSchema.nullable(),
  /** Free-form provider attributes (material, pattern, fit…). Displayed, never
   *  used for logic — provider vocabularies are not stable. */
  attributes: z.record(z.unknown()),
  taggingStatus: taggingStatusSchema,
  createdAt: z.string().datetime(),
});

export type Item = z.infer<typeof itemSchema>;

// --- create ----------------------------------------------------------------

/** Add a garment from a photo the user already uploaded and we already tagged. */
export const createItemFromAssetRequestSchema = z.object({
  assetId: uuidSchema,
  /** Optional overrides — the user can correct what the tagger got wrong. */
  title: z.string().min(1).max(120).optional(),
  category: itemCategorySchema.optional(),
  colourPrimary: itemColourSchema.optional(),
});

export type CreateItemFromAssetRequest = z.infer<typeof createItemFromAssetRequestSchema>;

/**
 * Add a garment from a pasted product URL (F4).
 *
 * Only a URL the user explicitly pasted is ever fetched — one page, no crawling,
 * no link-following, no enumeration (PROJECT.md §5.3).
 */
export const createItemFromUrlRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'https:' || protocol === 'http:';
    }, 'only http(s) URLs are supported'),
});

export type CreateItemFromUrlRequest = z.infer<typeof createItemFromUrlRequestSchema>;

// --- list ------------------------------------------------------------------

export const listItemsQuerySchema = z.object({
  category: itemCategorySchema.optional(),
  colour: itemColourSchema.optional(),
  source: itemSourceSchema.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(24),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
