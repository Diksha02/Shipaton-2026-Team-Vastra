import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  applyCatalogueQuery,
  matchesPrice,
  matchesSize,
  scaleForCategory,
  searchScore,
  type SearchableItem,
} from './catalogue-query';

function item(over: Partial<SearchableItem> & { id: string }): SearchableItem {
  return {
    title: 'Plain Tee',
    brand: 'ACME',
    category: 'top',
    colour: 'white',
    department: 'unisex',
    priceMinor: 2500,
    ...over,
  };
}

const CATALOGUE: SearchableItem[] = [
  item({ id: 'a', title: 'Black Selvedge Denim', brand: 'Studio Nord', category: 'bottom', colour: 'black', department: 'menswear', priceMinor: 12800, sizes: ['30', '32', '34'] }),
  item({ id: 'b', title: 'Cropped Moto Jacket', brand: 'ACME', category: 'outerwear', colour: 'black', department: 'womenswear', priceMinor: 24900, sizes: ['S', 'M'] }),
  item({ id: 'c', title: 'Tan Saddle Bag', brand: 'Maison Lu', category: 'bag', colour: 'brown', department: 'womenswear', priceMinor: 15900 }),
  item({ id: 'd', title: 'White Court Sneaker', brand: 'ACME', category: 'footwear', colour: 'white', department: 'unisex', priceMinor: 4500, sizes: ['8', '9', '10'] }),
  item({ id: 'e', title: 'Kids Rain Jacket', brand: 'Northbound', category: 'outerwear', colour: 'yellow', department: 'kids', priceMinor: 3200, sizes: ['S'] }),
];

const ids = (items: SearchableItem[]) => items.map((i) => i.id);

describe('search', () => {
  it('requires every term to match, not just one', () => {
    // The classic bad search: "black jacket" returning all black things AND all
    // jackets. It looks like it worked, which is worse than returning nothing.
    const results = applyCatalogueQuery(CATALOGUE, { text: 'black jacket' });
    expect(ids(results)).toEqual(['b']);
  });

  it('ranks a title hit above a brand hit', () => {
    const titleHit = item({ id: 't', title: 'ACME Coat', brand: 'Other' });
    const brandHit = item({ id: 'br', title: 'Wool Coat', brand: 'ACME' });
    expect(searchScore(titleHit, 'acme')).toBeGreaterThan(searchScore(brandHit, 'acme'));
  });

  it('ranks a whole word above a substring', () => {
    const whole = item({ id: 'w', title: 'Cotton Tee' });
    const inside = item({ id: 'i', title: 'Canteen Shirt' });
    expect(searchScore(whole, 'tee')).toBeGreaterThan(searchScore(inside, 'tee'));
  });

  it('is case and punctuation insensitive', () => {
    expect(searchScore(CATALOGUE[2]!, 'MAISON LU')).toBeGreaterThan(0);
    expect(searchScore(CATALOGUE[2]!, 'maison-lu')).toBeGreaterThan(0);
  });

  it('returns everything for an empty query rather than nothing', () => {
    expect(applyCatalogueQuery(CATALOGUE, { text: '   ' })).toHaveLength(CATALOGUE.length);
  });

  it('finds nothing for genuine nonsense', () => {
    expect(applyCatalogueQuery(CATALOGUE, { text: 'zzzz' })).toHaveLength(0);
  });

  it('searches by colour and category, not just words in the title', () => {
    expect(ids(applyCatalogueQuery(CATALOGUE, { text: 'brown bag' }))).toEqual(['c']);
  });
});

describe('price', () => {
  it('bands correctly at the boundaries', () => {
    expect(matchesPrice({ priceMinor: 4999 }, 'under_50')).toBe(true);
    expect(matchesPrice({ priceMinor: 5000 }, 'under_50')).toBe(false);
    expect(matchesPrice({ priceMinor: 5000 }, '50_150')).toBe(true);
    expect(matchesPrice({ priceMinor: 15000 }, '50_150')).toBe(true);
    expect(matchesPrice({ priceMinor: 15001 }, '50_150')).toBe(false);
    expect(matchesPrice({ priceMinor: 15001 }, 'over_150')).toBe(true);
  });

  it('never filters out items you already own', () => {
    // Unpriced means owned. "Free" is not "expensive".
    expect(matchesPrice({ priceMinor: null }, 'over_150')).toBe(true);
    expect(matchesPrice({ priceMinor: null }, 'under_50')).toBe(true);
  });
});

describe('sizes', () => {
  it('uses a different scale per category', () => {
    expect(scaleForCategory('top')).toBe('apparel');
    expect(scaleForCategory('bottom')).toBe('waist');
    expect(scaleForCategory('footwear')).toBe('shoe');
    expect(scaleForCategory('bag')).toBe('one_size');
  });

  it('matches within the right scale only', () => {
    const jeans = CATALOGUE[0]!;
    expect(matchesSize(jeans, { waist: '32' })).toBe(true);
    expect(matchesSize(jeans, { waist: '40' })).toBe(false);
    // A shoe size must not exclude a pair of jeans.
    expect(matchesSize(jeans, { shoe: '9' })).toBe(true);
  });

  it('never hides unsized categories', () => {
    // Excluding bags and sunglasses from a "my size" filter would silently
    // delete half the catalogue.
    expect(matchesSize(CATALOGUE[2]!, { apparel: 'S', waist: '32', shoe: '9' })).toBe(true);
  });

  it('shows items with no size data rather than hiding them', () => {
    // We do not know it does not fit, and hiding on missing data is worse than
    // showing it.
    const unknown = item({ id: 'u', category: 'top' });
    expect(matchesSize(unknown, { apparel: 'XXL' })).toBe(true);
  });

  it('filters a real catalogue by size profile', () => {
    const results = applyCatalogueQuery(CATALOGUE, { sizeProfile: { apparel: 'M', waist: '32' } });
    // The kids jacket is S only, so it goes; everything else stays.
    expect(ids(results).sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('sorting', () => {
  it('sorts by price both ways', () => {
    const low = applyCatalogueQuery(CATALOGUE, { sort: 'price_low' });
    expect(ids(low)).toEqual(['e', 'd', 'a', 'c', 'b']);
    expect(ids(applyCatalogueQuery(CATALOGUE, { sort: 'price_high' }))).toEqual(['b', 'c', 'a', 'd', 'e']);
  });

  it('sinks unpriced items instead of treating them as free', () => {
    // Otherwise everything you already own sorts above everything you could buy.
    const withOwned = [...CATALOGUE, item({ id: 'owned', priceMinor: null })];
    expect(ids(applyCatalogueQuery(withOwned, { sort: 'price_low' })).at(-1)).toBe('owned');
    expect(ids(applyCatalogueQuery(withOwned, { sort: 'price_high' })).at(-1)).toBe('owned');
  });

  it('keeps catalogue order for relevance with no query', () => {
    expect(ids(applyCatalogueQuery(CATALOGUE, { sort: 'relevance' }))).toEqual(ids(CATALOGUE));
  });

  it('never mutates the input', () => {
    const before = ids(CATALOGUE);
    applyCatalogueQuery(CATALOGUE, { sort: 'price_high' });
    expect(ids(CATALOGUE)).toEqual(before);
  });
});

describe('combining filters', () => {
  it('intersects rather than unions', () => {
    const results = applyCatalogueQuery(CATALOGUE, {
      departments: ['womenswear'],
      priceBand: 'over_150',
    });
    expect(ids(results).sort()).toEqual(['b', 'c']);
  });

  it('still includes unisex inside a department filter', () => {
    const results = applyCatalogueQuery(CATALOGUE, { departments: ['menswear'] });
    expect(ids(results)).toContain('d');
  });

  it('counts active filters without counting text or sort', () => {
    expect(activeFilterCount({ text: 'jacket', sort: 'price_low' })).toBe(0);
    expect(activeFilterCount({ departments: ['kids'], priceBand: 'under_50' })).toBe(2);
    expect(activeFilterCount({ priceBand: 'any' })).toBe(0);
    expect(activeFilterCount({ sizeProfile: {} })).toBe(0);
    expect(activeFilterCount({ sizeProfile: { apparel: 'M' } })).toBe(1);
  });
});
