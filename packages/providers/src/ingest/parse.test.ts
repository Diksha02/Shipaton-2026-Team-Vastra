import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseProductPage, toMinorUnits } from './parse';

/** Fixtures, never live sites — PROJECT.md §5.3. */
function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../../__fixtures__/${name}`, import.meta.url)), 'utf8');
}

describe('parseProductPage — JSON-LD', () => {
  it('extracts a product, preferring JSON-LD over the Open Graph fallback', () => {
    const product = parseProductPage(fixture('product-jsonld.html'));

    expect(product).not.toBeNull();
    expect(product?.source).toBe('json-ld');
    expect(product?.title).toBe('Oversized Cotton Shirt');
    expect(product?.brand).toBe('ACME');
    expect(product?.externalId).toBe('ACME-SHIRT-001');
    expect(product?.priceMinor).toBe(8900);
    expect(product?.currency).toBe('GBP');
    // First image of the array, not the og: fallback.
    expect(product?.imageUrl).toBe('https://cdn.example.com/shirt-1.jpg');
  });

  it('survives a malformed block, walks @graph, and handles array @type', () => {
    const product = parseProductPage(fixture('product-graph-malformed.html'));

    expect(product?.title).toBe('Pleated Midi Skirt');
    expect(product?.externalId).toBe('SK-2291');
    expect(product?.brand).toBe('Studio Nord');
    expect(product?.imageUrl).toBe('https://cdn.example.com/skirt.jpg');
  });

  it('does not multiply zero-decimal currencies by 100', () => {
    const product = parseProductPage(fixture('product-graph-malformed.html'));
    // ¥12,800 is 12800 minor units, not 1,280,000.
    expect(product?.currency).toBe('JPY');
    expect(product?.priceMinor).toBe(12800);
  });
});

describe('parseProductPage — Open Graph fallback', () => {
  it('falls back when no JSON-LD Product exists', () => {
    const product = parseProductPage(fixture('product-og-only.html'));

    expect(product?.source).toBe('open-graph');
    // Attribute order is reversed in this fixture and the title is entity-encoded.
    expect(product?.title).toBe('Wool Overcoat & Belt');
    expect(product?.brand).toBe('Northbound');
    expect(product?.priceMinor).toBe(24999);
    expect(product?.currency).toBe('GBP');
  });

  it('returns null when a page has neither, so the caller can offer manual entry', () => {
    expect(parseProductPage('<html><body>nothing here</body></html>')).toBeNull();
  });
});

describe('toMinorUnits', () => {
  it('uses two decimals by default', () => {
    expect(toMinorUnits(89, 'GBP')).toBe(8900);
    expect(toMinorUnits(249.99, 'USD')).toBe(24999);
  });

  it('uses zero decimals for currencies without a minor unit', () => {
    expect(toMinorUnits(12800, 'JPY')).toBe(12800);
    expect(toMinorUnits(5000, 'KRW')).toBe(5000);
  });

  it('rounds rather than truncating float artefacts', () => {
    expect(toMinorUnits(19.99, 'GBP')).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2, 'GBP')).toBe(30);
  });
});
