import { z } from 'zod';
import { matchesDepartments, type Department, type ItemCategory, type ItemColour } from './enums';

/**
 * Searching, filtering and sorting the catalogue.
 *
 * Pure and shared, for the same reason the slot rule is: the client runs it to
 * filter what it already has in memory, and the server will run it to build a
 * query. One implementation means a search that behaves identically offline and
 * online, rather than two subtly different rankings a user has to learn.
 */

// --- sizes -----------------------------------------------------------------

/**
 * Sizes are per *category*, because a single scale is a lie: a shirt is M, jeans
 * are a waist measurement, and shoes are a number. Filtering "my size" across
 * all three at once is the thing that makes retail filters useless.
 */
export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const WAIST_SIZES = ['26', '28', '30', '32', '34', '36', '38', '40'] as const;
export const SHOE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'] as const;

export const sizeScaleSchema = z.enum(['apparel', 'waist', 'shoe', 'one_size']);
export type SizeScale = z.infer<typeof sizeScaleSchema>;

/** Which scale a category is measured on. */
export function scaleForCategory(category: ItemCategory): SizeScale {
  switch (category) {
    case 'top':
    case 'dress':
    case 'outerwear':
    case 'underwear':
    case 'swimwear':
      return 'apparel';
    case 'bottom':
      return 'waist';
    case 'footwear':
      return 'shoe';
    default:
      // Bags, accessories and headwear are not sized in any way worth filtering.
      return 'one_size';
  }
}

export function sizesForScale(scale: SizeScale): readonly string[] {
  if (scale === 'apparel') return APPAREL_SIZES;
  if (scale === 'waist') return WAIST_SIZES;
  if (scale === 'shoe') return SHOE_SIZES;
  return [];
}

/** What someone wears, per scale. Any of them may be unset. */
export interface SizeProfile {
  apparel?: string;
  waist?: string;
  shoe?: string;
}

/**
 * True when an item is available in this person's size.
 *
 * Unsized categories (bags, sunglasses) always match — excluding them from a
 * "my size" filter would hide half the catalogue for no reason. So does an item
 * with no size data at all: we do not know that it *doesn't* fit, and hiding
 * something on missing data is worse than showing it.
 */
export function matchesSize(
  item: { category: ItemCategory; sizes?: readonly string[] },
  profile: SizeProfile,
): boolean {
  const scale = scaleForCategory(item.category);
  if (scale === 'one_size') return true;

  const wanted = profile[scale];
  if (!wanted) return true;
  if (!item.sizes || item.sizes.length === 0) return true;

  return item.sizes.includes(wanted);
}

// --- price -----------------------------------------------------------------

export const PRICE_BANDS = ['any', 'under_50', '50_150', 'over_150'] as const;
export const priceBandSchema = z.enum(PRICE_BANDS);
export type PriceBand = z.infer<typeof priceBandSchema>;

export const PRICE_BAND_LABEL: Readonly<Record<PriceBand, string>> = Object.freeze({
  any: 'Any price',
  under_50: 'Under £50',
  '50_150': '£50–150',
  over_150: 'Over £150',
});

/**
 * Bands rather than a two-handle slider. A slider asks someone to invent two
 * numbers; three bands ask them to recognise one. Reducing the number of
 * *decisions* beats reducing the number of taps.
 */
export function matchesPrice(item: { priceMinor: number | null }, band: PriceBand): boolean {
  if (band === 'any') return true;
  // Items with no price are things you already own. They are never excluded by
  // a price filter, because "free" is not "expensive".
  if (item.priceMinor === null) return true;

  const pounds = item.priceMinor / 100;
  if (band === 'under_50') return pounds < 50;
  if (band === '50_150') return pounds >= 50 && pounds <= 150;
  return pounds > 150;
}

// --- sorting ---------------------------------------------------------------

export const SORT_OPTIONS = ['relevance', 'price_low', 'price_high', 'name'] as const;
export const sortOptionSchema = z.enum(SORT_OPTIONS);
export type SortOption = z.infer<typeof sortOptionSchema>;

export const SORT_LABEL: Readonly<Record<SortOption, string>> = Object.freeze({
  relevance: 'Best match',
  price_low: 'Price: low to high',
  price_high: 'Price: high to low',
  name: 'Name',
});

// --- search ----------------------------------------------------------------

export interface SearchableItem {
  id: string;
  title: string;
  brand: string | null;
  category: ItemCategory;
  colour: ItemColour;
  department: Department;
  priceMinor: number | null;
  sizes?: readonly string[];
}

/** Normalises for comparison: case, accents and punctuation all folded away, so
 *  "Maison Lu" matches "maison-lu" and "MAISON LU". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * How well an item matches a query. Zero means no match at all.
 *
 * Every term must match something (AND, not OR) — searching "black jacket"
 * returning every black item *and* every jacket is the classic bad search, and
 * it is worse than no search because it looks like it worked.
 *
 * Field weights encode what people mean: a title hit beats a brand hit, which
 * beats a colour hit. A whole-word match beats a prefix, which beats a
 * substring, so "tee" ranks an actual tee above a "canteen".
 */
export function searchScore(item: SearchableItem, query: string): number {
  const terms = normalise(query).split(' ').filter(Boolean);
  if (terms.length === 0) return 1;

  const fields: Array<{ text: string; weight: number }> = [
    { text: normalise(item.title), weight: 10 },
    { text: normalise(item.brand ?? ''), weight: 6 },
    { text: normalise(item.category), weight: 4 },
    { text: normalise(item.colour), weight: 3 },
    { text: normalise(item.department), weight: 2 },
  ];

  let total = 0;

  for (const term of terms) {
    let best = 0;
    for (const field of fields) {
      if (!field.text) continue;
      const words = field.text.split(' ');
      if (words.includes(term)) best = Math.max(best, field.weight * 3);
      else if (words.some((w) => w.startsWith(term))) best = Math.max(best, field.weight * 2);
      else if (field.text.includes(term)) best = Math.max(best, field.weight);
    }
    // One unmatched term disqualifies the item entirely.
    if (best === 0) return 0;
    total += best;
  }

  return total;
}

// --- the whole query -------------------------------------------------------

export interface CatalogueQuery {
  text?: string;
  departments?: readonly Department[];
  categories?: readonly ItemCategory[];
  priceBand?: PriceBand;
  /** When set, only items available in these sizes are returned. */
  sizeProfile?: SizeProfile;
  brand?: string | null;
  sort?: SortOption;
}

/** How many filters are active, for a badge on the filter button. `text` and
 *  `sort` are not filters and are excluded deliberately. */
export function activeFilterCount(query: CatalogueQuery): number {
  let count = 0;
  if (query.departments?.length) count += 1;
  if (query.categories?.length) count += 1;
  if (query.priceBand && query.priceBand !== 'any') count += 1;
  if (query.brand) count += 1;
  if (query.sizeProfile && Object.values(query.sizeProfile).some(Boolean)) count += 1;
  return count;
}

/**
 * Filter, then sort. Returns a new array and never mutates the input.
 *
 * `relevance` falls back to the original order when there is no search text,
 * because "best match" with nothing to match on should preserve whatever
 * curation the catalogue already had rather than shuffling it.
 */
export function applyCatalogueQuery<T extends SearchableItem>(
  items: readonly T[],
  query: CatalogueQuery,
): T[] {
  const text = query.text?.trim() ?? '';
  const sort = query.sort ?? 'relevance';

  const scored: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    if (query.brand && item.brand !== query.brand) continue;
    if (!matchesDepartments(item, query.departments ?? [])) continue;
    if (query.categories?.length && !query.categories.includes(item.category)) continue;
    if (!matchesPrice(item, query.priceBand ?? 'any')) continue;
    if (query.sizeProfile && !matchesSize(item, query.sizeProfile)) continue;

    const score = text ? searchScore(item, text) : 1;
    if (score === 0) continue;

    scored.push({ item, score });
  }

  scored.sort((a, b) => {
    if (sort === 'price_low' || sort === 'price_high') {
      // Unpriced items sink rather than sorting as zero, which would put
      // everything you already own above everything you could buy.
      const ap = a.item.priceMinor;
      const bp = b.item.priceMinor;
      if (ap === null && bp === null) return 0;
      if (ap === null) return 1;
      if (bp === null) return -1;
      return sort === 'price_low' ? ap - bp : bp - ap;
    }
    if (sort === 'name') return a.item.title.localeCompare(b.item.title);
    // relevance
    if (b.score !== a.score) return b.score - a.score;
    return 0;
  });

  return scored.map((s) => s.item);
}
