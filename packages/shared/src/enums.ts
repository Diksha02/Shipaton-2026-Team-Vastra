import { z } from 'zod';

/**
 * Every enum in the system, defined once. The Drizzle schema in `@vastra/db`
 * derives its pgEnum values from these arrays so the database and the API can
 * never drift apart.
 */

// --- assets ----------------------------------------------------------------

export const ASSET_KINDS = ['avatar', 'garment', 'tryon', 'catalogue'] as const;
export const assetKindSchema = z.enum(ASSET_KINDS);
export type AssetKind = z.infer<typeof assetKindSchema>;

/**
 * `pending`  — uploaded, not yet judged
 * `pass`     — safe to serve
 * `review`   — human queue; never served
 * `fail`     — rejected; never served
 *
 * PROJECT.md §4: no asset is ever served to a client with a status other than
 * `pass`. That is enforced in the query layer, not by callers remembering.
 */
export const MODERATION_STATUSES = ['pending', 'pass', 'review', 'fail'] as const;
export const moderationStatusSchema = z.enum(MODERATION_STATUSES);
export type ModerationStatus = z.infer<typeof moderationStatusSchema>;

export const MODERATION_VERDICTS = ['pass', 'fail', 'review'] as const;
export const moderationVerdictSchema = z.enum(MODERATION_VERDICTS);
export type ModerationVerdict = z.infer<typeof moderationVerdictSchema>;

// --- items -----------------------------------------------------------------

export const ITEM_SOURCES = ['user_photo', 'user_url', 'catalogue'] as const;
export const itemSourceSchema = z.enum(ITEM_SOURCES);
export type ItemSource = z.infer<typeof itemSourceSchema>;

export const TAGGING_STATUSES = ['pending', 'tagged', 'failed', 'manual'] as const;
export const taggingStatusSchema = z.enum(TAGGING_STATUSES);
export type TaggingStatus = z.infer<typeof taggingStatusSchema>;

/**
 * Our own garment taxonomy. Provider vocabularies (Ximilar, retailer feeds) are
 * mapped onto this via the `taxonomy_map` table rather than being trusted
 * directly — provider categories change without notice.
 *
 * `underwear` and `swimwear` are first-class categories, not edge cases. See
 * the moderation thresholds in PROJECT.md §5.1.
 */
export const ITEM_CATEGORIES = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'footwear',
  'bag',
  'accessory',
  'headwear',
  'underwear',
  'swimwear',
  'other',
] as const;
export const itemCategorySchema = z.enum(ITEM_CATEGORIES);
export type ItemCategory = z.infer<typeof itemCategorySchema>;

/** Filterable colour buckets. Deliberately coarse — this drives a filter chip
 *  row, not a colour-matching algorithm. The precise value lives in
 *  `items.attributes`. */
export const ITEM_COLOURS = [
  'black',
  'white',
  'grey',
  'beige',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'multi',
  'other',
] as const;
export const itemColourSchema = z.enum(ITEM_COLOURS);
export type ItemColour = z.infer<typeof itemColourSchema>;

/**
 * Who a garment is cut for.
 *
 * Called *department* rather than gender on purpose. This is a retail
 * merchandising axis — the section of a shop an item sits in — not a claim about
 * the person browsing. Someone may shop menswear, womenswear and kids in the
 * same session, and plenty of people shop across all of them for themselves.
 *
 * `unisex` is a real department, not a fallback for missing data: it is how the
 * item is *sold*. A user's own uploaded clothes default to it because we have no
 * business assigning a department to something they already own and wear.
 */
export const DEPARTMENTS = ['womenswear', 'menswear', 'kids', 'unisex'] as const;
export const departmentSchema = z.enum(DEPARTMENTS);
export type Department = z.infer<typeof departmentSchema>;

export const DEPARTMENT_LABEL: Readonly<Record<Department, string>> = Object.freeze({
  womenswear: 'Women',
  menswear: 'Men',
  kids: 'Kids',
  unisex: 'Unisex',
});

/**
 * Which departments a shopper wants to see. Multi-select, and empty means
 * *everything* rather than nothing — an empty filter that hid the whole
 * catalogue would read as a broken app.
 */
export function matchesDepartments(
  item: { department: Department },
  selected: readonly Department[],
): boolean {
  if (selected.length === 0) return true;
  // Unisex belongs in every department's results. Filtering it out is the
  // classic bug here: shop Menswear and the plain white tees vanish.
  if (item.department === 'unisex') return true;
  return selected.includes(item.department);
}

// --- outfits ---------------------------------------------------------------

/** A `finalised` outfit is immutable: no adding, removing or reordering items.
 *  It remains deletable — always (PROJECT.md §4). */
export const OUTFIT_STATUSES = ['draft', 'finalised'] as const;
export const outfitStatusSchema = z.enum(OUTFIT_STATUSES);
export type OutfitStatus = z.infer<typeof outfitStatusSchema>;

export const OUTFIT_MIN_ITEMS = 2;
export const OUTFIT_MAX_ITEMS = 6;

// --- try-on ----------------------------------------------------------------

export const TRYON_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export const tryonStatusSchema = z.enum(TRYON_STATUSES);
export type TryonStatus = z.infer<typeof tryonStatusSchema>;

// --- billing ---------------------------------------------------------------

export const ENTITLEMENT_KINDS = ['consumable', 'subscription'] as const;
export const entitlementKindSchema = z.enum(ENTITLEMENT_KINDS);
export type EntitlementKind = z.infer<typeof entitlementKindSchema>;

/** Product identifiers, per PROJECT.md §6. These strings must match the store
 *  consoles and the RevenueCat dashboard exactly. */
export const PRODUCT_IDS = [
  'slots_3',
  'slots_10',
  'wardrobe_plus_monthly',
  'wardrobe_plus_annual',
] as const;
export const productIdSchema = z.enum(PRODUCT_IDS);
export type ProductId = z.infer<typeof productIdSchema>;

/** The single RevenueCat entitlement identifier (PROJECT.md §6). */
export const ENTITLEMENT_PLUS = 'plus' as const;

/** Slots granted per consumable pack. The server is the only place this map
 *  exists — the client never computes an entitlement. */
export const SLOT_PACK_GRANTS: Readonly<Record<'slots_3' | 'slots_10', number>> = Object.freeze({
  slots_3: 3,
  slots_10: 10,
});

