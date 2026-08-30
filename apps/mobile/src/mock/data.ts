import type { Department, ItemCategory, ItemColour } from '@vastra/shared';
import type { ImageSourcePropType } from 'react-native';

import acc01 from '../../assets/garments/acc-01.webp';
import acc01Thumb from '../../assets/garments/thumb/acc-01.webp';
import bag01 from '../../assets/garments/bag-01.webp';
import bag01Thumb from '../../assets/garments/thumb/bag-01.webp';
import bag02 from '../../assets/garments/bag-02.webp';
import bag02Thumb from '../../assets/garments/thumb/bag-02.webp';
import bottom03 from '../../assets/garments/bottom-03.webp';
import bottom03Thumb from '../../assets/garments/thumb/bottom-03.webp';
import bottom04 from '../../assets/garments/bottom-04.webp';
import bottom04Thumb from '../../assets/garments/thumb/bottom-04.webp';
import bottom05 from '../../assets/garments/bottom-05.webp';
import bottom05Thumb from '../../assets/garments/thumb/bottom-05.webp';
import hat01 from '../../assets/garments/hat-01.webp';
import hat01Thumb from '../../assets/garments/thumb/hat-01.webp';
import hat02 from '../../assets/garments/hat-02.webp';
import hat02Thumb from '../../assets/garments/thumb/hat-02.webp';
import hat03 from '../../assets/garments/hat-03.webp';
import hat03Thumb from '../../assets/garments/thumb/hat-03.webp';
import outer01 from '../../assets/garments/outer-01.webp';
import outer01Thumb from '../../assets/garments/thumb/outer-01.webp';
import outer05 from '../../assets/garments/outer-05.webp';
import outer05Thumb from '../../assets/garments/thumb/outer-05.webp';
import outer06 from '../../assets/garments/outer-06.webp';
import outer06Thumb from '../../assets/garments/thumb/outer-06.webp';
import shoe02 from '../../assets/garments/shoe-02.webp';
import shoe02Thumb from '../../assets/garments/thumb/shoe-02.webp';
import shoe03 from '../../assets/garments/shoe-03.webp';
import shoe03Thumb from '../../assets/garments/thumb/shoe-03.webp';
import top04 from '../../assets/garments/top-04.webp';
import top04Thumb from '../../assets/garments/thumb/top-04.webp';
import top06 from '../../assets/garments/top-06.webp';
import top06Thumb from '../../assets/garments/thumb/top-06.webp';
import top07 from '../../assets/garments/top-07.webp';
import top07Thumb from '../../assets/garments/thumb/top-07.webp';

/**
 * Mock data for design review only.
 *
 * Replaced by real API responses once credentials exist (docs/CREDENTIALS.md).
 * Shapes mirror the zod schemas in @vastra/shared so swapping the source is a
 * data-layer change, not a rewrite of every screen.
 *
 * PLACEHOLDER IMAGERY — see docs/ASSETS.md. Every garment is a transparent
 * cutout (U2Net segmentation, Unsplash-licensed source) so it can be layered
 * onto the figure and so every surface shows garments on the app's own
 * background rather than on somebody's kitchen table. Items are named after
 * what their photo actually shows.
 */

export interface MockItem {
  id: string;
  title: string;
  brand: string | null;
  category: ItemCategory;
  /** Retail section. Owned pieces are `unisex` — we have no business assigning
   *  a department to clothes someone already wears. */
  department: Department;
  /** Sizes stocked. Undefined for unsized things — bags, sunglasses — and for
   *  pieces you already own, where the question does not arise. */
  sizes?: string[];
  colour: ItemColour;
  priceMinor: number | null;
  currency: string;
  owned: boolean;
  /** Where 'View at retailer' goes. Null for pieces you already own. */
  retailerUrl: string | null;
  /** 800px transparent WebP — stage, grid, hero. */
  image: ImageSourcePropType;
  /** 240px transparent WebP — carousels and strips. */
  thumb: ImageSourcePropType;
}

/** Used where a colour stands in for a garment — brand accents, chips. */
export const COLOUR_SWATCH: Record<ItemColour, string> = {
  black: '#1C1917',
  white: '#F5F5F4',
  grey: '#A8A29E',
  beige: '#D8CCBA',
  brown: '#7C5C42',
  red: '#9F2E2E',
  orange: '#C2652B',
  yellow: '#D2A63C',
  green: '#4A6B4F',
  blue: '#3C5A78',
  purple: '#6B5480',
  pink: '#C48B96',
  multi: '#8B8178',
  other: '#8B8178',
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  footwear: 'Shoes',
  bag: 'Bags',
  accessory: 'Accessories',
  headwear: 'Hats',
  underwear: 'Underwear',
  swimwear: 'Swim',
  other: 'Other',
};

export const wardrobe: MockItem[] = [
  { id: 'w1', title: 'Cotton Sweatshirt', brand: null, category: 'top', department: 'unisex', colour: 'white', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: top07, thumb: top07Thumb },
  { id: 'w2', title: 'Crochet Knit Top', brand: null, category: 'top', department: 'unisex', colour: 'yellow', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: top04, thumb: top04Thumb },
  { id: 'w3', title: 'Lace Camisole', brand: null, category: 'top', department: 'unisex', colour: 'black', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: top06, thumb: top06Thumb },

  { id: 'w4', title: 'Mid-Wash Slim Jean', brand: null, category: 'bottom', department: 'unisex', colour: 'blue', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: bottom03, thumb: bottom03Thumb },
  { id: 'w5', title: 'Turn-Up Denim', brand: null, category: 'bottom', department: 'unisex', colour: 'blue', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: bottom04, thumb: bottom04Thumb },

  { id: 'w6', title: 'Leather Biker Jacket', brand: null, category: 'outerwear', department: 'unisex', colour: 'black', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: outer01, thumb: outer01Thumb },
  { id: 'w7', title: 'Rust Bomber', brand: null, category: 'outerwear', department: 'unisex', colour: 'brown', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: outer06, thumb: outer06Thumb },

  { id: 'w8', title: 'White Leather Trainers', brand: null, category: 'footwear', department: 'unisex', colour: 'white', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: shoe02, thumb: shoe02Thumb },
  { id: 'w9', title: 'Court Sneaker', brand: null, category: 'footwear', department: 'unisex', colour: 'white', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: shoe03, thumb: shoe03Thumb },

  { id: 'w10', title: 'Woven Leather Tote', brand: null, category: 'bag', department: 'unisex', colour: 'brown', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: bag01, thumb: bag01Thumb },

  { id: 'w11', title: 'Round Sunglasses', brand: null, category: 'accessory', department: 'unisex', colour: 'black', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: acc01, thumb: acc01Thumb },

  { id: 'w12', title: 'White Trucker Cap', brand: null, category: 'headwear', department: 'unisex', colour: 'white', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: hat01, thumb: hat01Thumb },
  { id: 'w13', title: 'Washed Denim Cap', brand: null, category: 'headwear', department: 'unisex', colour: 'grey', priceMinor: null, currency: 'GBP', owned: true, retailerUrl: null, image: hat02, thumb: hat02Thumb },
];

export const catalogue: MockItem[] = [
  { id: 'c1', title: 'Black Selvedge Denim', brand: 'Studio Nord', category: 'bottom', sizes: ['30','32','34','36'], department: 'menswear', colour: 'black', priceMinor: 12800, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/studio-nord/c1', image: bottom05, thumb: bottom05Thumb },
  { id: 'c2', title: 'Cropped Moto Jacket', brand: 'ACME', category: 'outerwear', sizes: ['S','M','L'], department: 'womenswear', colour: 'black', priceMinor: 24900, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/acme/c2', image: outer05, thumb: outer05Thumb },
  { id: 'c3', title: 'Tan Saddle Bag', brand: 'Maison Lu', category: 'bag', department: 'womenswear', colour: 'brown', priceMinor: 15900, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/maison-lu/c3', image: bag02, thumb: bag02Thumb },
  { id: 'c4', title: 'Two-Tone Trucker Cap', brand: 'Northbound', category: 'headwear', department: 'unisex', colour: 'black', priceMinor: 4500, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c4', image: hat03, thumb: hat03Thumb },
  { id: 'c5', title: 'Mid-Wash Straight Jean', brand: 'Studio Nord', category: 'bottom', sizes: ['26','28','30','32'], department: 'womenswear', colour: 'blue', priceMinor: 8900, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/studio-nord/c5', image: bottom03, thumb: bottom03Thumb },
  { id: 'c6', title: 'Turn-Up Work Trouser', brand: 'Northbound', category: 'bottom', sizes: ['30','32','34'], department: 'menswear', colour: 'blue', priceMinor: 6400, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c6', image: bottom04, thumb: bottom04Thumb },
  { id: 'c7', title: 'Rust Wool Bomber', brand: 'Maison Lu', category: 'outerwear', sizes: ['M','L','XL'], department: 'menswear', colour: 'brown', priceMinor: 18500, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/maison-lu/c7', image: outer06, thumb: outer06Thumb },
  { id: 'c8', title: 'Classic Leather Biker', brand: 'ACME', category: 'outerwear', sizes: ['XS','S','M'], department: 'womenswear', colour: 'black', priceMinor: 34900, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/acme/c8', image: outer01, thumb: outer01Thumb },
  { id: 'c9', title: 'Heavyweight Cotton Sweat', brand: 'Northbound', category: 'top', sizes: ['S','M','L','XL'], department: 'unisex', colour: 'white', priceMinor: 4200, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c9', image: top07, thumb: top07Thumb },
  { id: 'c10', title: 'Crochet Knit Vest', brand: 'Maison Lu', category: 'top', sizes: ['XS','S','M'], department: 'womenswear', colour: 'yellow', priceMinor: 7600, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/maison-lu/c10', image: top04, thumb: top04Thumb },
  { id: 'c11', title: 'Lace Trim Camisole', brand: 'Maison Lu', category: 'top', sizes: ['XS','S','M','L'], department: 'womenswear', colour: 'black', priceMinor: 5400, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/maison-lu/c11', image: top06, thumb: top06Thumb },
  { id: 'c12', title: 'Court Sneaker', brand: 'ACME', category: 'footwear', sizes: ['7','8','9','10','11'], department: 'unisex', colour: 'white', priceMinor: 8200, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/acme/c12', image: shoe03, thumb: shoe03Thumb },
  { id: 'c13', title: 'White Leather Trainer', brand: 'Studio Nord', category: 'footwear', sizes: ['6','7','8','9'], department: 'unisex', colour: 'white', priceMinor: 11500, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/studio-nord/c13', image: shoe02, thumb: shoe02Thumb },
  { id: 'c14', title: 'Woven Leather Tote', brand: 'Maison Lu', category: 'bag', department: 'womenswear', colour: 'brown', priceMinor: 21000, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/maison-lu/c14', image: bag01, thumb: bag01Thumb },
  { id: 'c15', title: 'Round Frame Sunglasses', brand: 'ACME', category: 'accessory', department: 'unisex', colour: 'black', priceMinor: 3800, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/acme/c15', image: acc01, thumb: acc01Thumb },
  { id: 'c16', title: 'Canvas Trucker Cap', brand: 'Northbound', category: 'headwear', department: 'kids', colour: 'white', priceMinor: 1900, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c16', image: hat01, thumb: hat01Thumb },
  { id: 'c17', title: 'Washed Denim Cap', brand: 'Northbound', category: 'headwear', department: 'kids', colour: 'grey', priceMinor: 2200, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c17', image: hat02, thumb: hat02Thumb },
  { id: 'c18', title: 'Kids Rain Bomber', brand: 'Northbound', category: 'outerwear', sizes: ['XS','S','M'], department: 'kids', colour: 'brown', priceMinor: 3400, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c18', image: outer06, thumb: outer06Thumb },
  { id: 'c19', title: 'Kids Everyday Sweat', brand: 'Northbound', category: 'top', sizes: ['XS','S','M'], department: 'kids', colour: 'white', priceMinor: 2400, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/northbound/c19', image: top07, thumb: top07Thumb },
  { id: 'c20', title: 'Kids Court Sneaker', brand: 'ACME', category: 'footwear', sizes: ['6','7','8'], department: 'kids', colour: 'white', priceMinor: 3200, currency: 'GBP', owned: false, retailerUrl: 'https://example.com/acme/c20', image: shoe03, thumb: shoe03Thumb },
];

export const BRANDS = ['ACME', 'Northbound', 'Studio Nord', 'Maison Lu'] as const;

export interface MockOutfit {
  id: string;
  name: string;
  itemIds: string[];
  finalised: boolean;
}

/** Four of five spaces filled — the app opens one save away from the paywall,
 *  which is the moment §6 says to trigger it. */
export const outfits: MockOutfit[] = [
  { id: 'o1', name: 'Monday, office', itemIds: ['w1', 'w4', 'w8'], finalised: true },
  { id: 'o2', name: 'Weekend market', itemIds: ['w2', 'w5', 'w10'], finalised: true },
  { id: 'o3', name: 'Dinner', itemIds: ['w3', 'w4', 'w9'], finalised: true },
  { id: 'o4', name: 'Cold commute', itemIds: ['w6', 'w5', 'w8'], finalised: true },
];

export const FREE_SLOTS = 5;

export function formatPrice(minor: number | null, currency: string): string {
  if (minor === null) return '';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
  return `${symbol}${(minor / 100).toFixed(2).replace(/\.00$/, '')}`;
}

export function itemsByIds(ids: readonly string[]): MockItem[] {
  const all = [...wardrobe, ...catalogue];
  return ids.flatMap((id) => all.filter((item) => item.id === id));
}

/** Locked V1 features (PROJECT.md §2.2). Coming soon badge and a Notify me
 *  action — never a Buy or Unlock CTA. */
export const lockedFeatures = [
  { key: 'social', title: 'Likes & comments', blurb: 'React to outfits from friends.' },
  { key: 'ai_style', title: 'AI style advice', blurb: 'Suggestions built from what you already own.' },
] as const;

// ---------------------------------------------------------------------------
// Home feed
// ---------------------------------------------------------------------------

export interface MockLook {
  id: string;
  handle: string;
  caption: string;
  itemIds: string[];
  likes: number;
}

/** 'What others are wearing'. Locked in V1 — the social graph is on the §2.3
 *  cut list — so these render as a teaser, never a working feed. */
export const communityLooks: MockLook[] = [
  { id: 'l1', handle: '@sena', caption: 'Layered for the cold snap', itemIds: ['w6', 'w5', 'w8'], likes: 412 },
  { id: 'l2', handle: '@marlow', caption: 'One colour, three textures', itemIds: ['w1', 'w4', 'w9'], likes: 288 },
  { id: 'l3', handle: '@iris.k', caption: 'Market run', itemIds: ['w2', 'w5', 'w10'], likes: 197 },
];

export interface BrandMoment {
  id: string;
  brand: string;
  /** URL-safe brand key, so a card can open that brand's page. */
  slug: string;
  /**
   * True when the brand paid for this placement.
   *
   * Part of the data, not a styling choice: a paid placement must be labelled
   * as an ad under the UK CAP Code and FTC endorsement guidance, and a flag the
   * renderer cannot ignore is the only version that survives a redesign.
   */
  sponsored: boolean;
  kind: 'free_tryon' | 'dropping' | 'new_in';
  headline: string;
  detail: string;
  image: ImageSourcePropType;
  thumb: ImageSourcePropType;
  tint: ItemColour;
}

/** Brand connections are locked in V1 (§2.2) — teasers with a Notify me action
 *  and never a purchase path. */
export const brandMoments: BrandMoment[] = [
  {
    id: 'b1',
    brand: 'Studio Nord',
    slug: 'studio-nord',
    sponsored: true,
    kind: 'free_tryon',
    headline: 'Free try-on week',
    detail: 'Their whole autumn range, on you, at no cost.',
    image: bottom05,
    thumb: bottom05Thumb,
    tint: 'beige',
  },
  {
    id: 'b2',
    brand: 'Maison Lu',
    slug: 'maison-lu',
    sponsored: false,
    kind: 'dropping',
    headline: 'Drops Friday',
    detail: 'Cashmere restock. 40 pieces.',
    image: bag02,
    thumb: bag02Thumb,
    tint: 'brown',
  },
  {
    id: 'b3',
    brand: 'ACME',
    slug: 'acme',
    sponsored: false,
    kind: 'new_in',
    headline: 'New in',
    detail: '12 pieces added this week.',
    image: outer05,
    thumb: outer05Thumb,
    tint: 'grey',
  },
];

export const BRAND_KIND_LABEL: Record<BrandMoment['kind'], string> = {
  free_tryon: 'Free try-on',
  dropping: 'Coming soon',
  new_in: 'New in',
};

/** Trending catalogue pieces — the shoppable surface (F9/F10). */
export const trending: MockItem[] = catalogue;

/**
 * Categories the studio composes.
 *
 * Order matters twice: it is the order of the category strip, and
 * `top → bottom → footwear` is the order the figure stacks on the stage.
 */
export const STUDIO_LAYERS = [
  'top',
  'bottom',
  'outerwear',
  'footwear',
  'bag',
  'accessory',
  'headwear',
] as const;
export type StudioLayer = (typeof STUDIO_LAYERS)[number];

export const STUDIO_LAYER_LABEL: Record<StudioLayer, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  outerwear: 'Outerwear',
  footwear: 'Shoes',
  bag: 'Bags',
  accessory: 'Accessories',
  headwear: 'Hats',
};

export function itemsForLayer(layer: StudioLayer): MockItem[] {
  return wardrobe.filter((item) => item.category === layer);
}
