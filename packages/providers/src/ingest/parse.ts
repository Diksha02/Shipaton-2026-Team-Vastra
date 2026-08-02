/**
 * Product extraction from a retailer page (PROJECT.md §5.3).
 *
 * Parse order is schema.org JSON-LD first, Open Graph second, then fail with a
 * clear path to manual entry. JSON-LD is preferred because it is structured
 * data the retailer publishes deliberately for exactly this purpose — Open
 * Graph is a social-preview format we are borrowing.
 *
 * Deliberately dependency-free and pure: these functions take an HTML string
 * and return data, so every case is testable against a saved fixture and CI
 * never touches a live retailer site.
 */

export interface ParsedProduct {
  title: string;
  brand: string | null;
  priceMinor: number | null;
  currency: string | null;
  imageUrl: string | null;
  externalId: string | null;
  source: 'json-ld' | 'open-graph';
  raw: unknown;
}

/** Currencies with no minor unit. Multiplying these by 100 silently inflates a
 *  price a hundredfold, which is the kind of bug that reaches production. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'ISK',
  'UGX',
  'RWF',
  'XAF',
  'XOF',
  'XPF',
  'BIF',
  'DJF',
  'GNF',
  'KMF',
  'MGA',
  'PYG',
  'VUV',
]);

export function toMinorUnits(amount: number, currency: string | null): number {
  const decimals = currency && ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
  return Math.round(amount * 10 ** decimals);
}

const JSON_LD_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];

  for (const match of html.matchAll(JSON_LD_RE)) {
    const body = match[1];
    if (!body) continue;
    try {
      blocks.push(JSON.parse(body.trim()));
    } catch {
      // A malformed block is normal in the wild. Skip it and keep looking —
      // one broken script must not lose us a valid one further down the page.
    }
  }

  return blocks;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasType(node: Record<string, unknown>, type: string): boolean {
  const raw = node['@type'];
  if (typeof raw === 'string') return raw.toLowerCase() === type.toLowerCase();
  if (Array.isArray(raw)) {
    return raw.some((t) => typeof t === 'string' && t.toLowerCase() === type.toLowerCase());
  }
  return false;
}

/** Walks arrays and `@graph` containers to find the first Product node. */
export function findProductNode(blocks: readonly unknown[]): Record<string, unknown> | null {
  const queue: unknown[] = [...blocks];

  while (queue.length > 0) {
    const node = queue.shift();

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }
    if (!isRecord(node)) continue;

    if (hasType(node, 'Product')) return node;

    const graph = node['@graph'];
    if (Array.isArray(graph)) queue.push(...graph);
  }

  return null;
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstString(entry);
      if (found) return found;
    }
  }
  if (isRecord(value)) {
    // schema.org allows nested nodes: brand can be { "@type": "Brand", name: … },
    // image can be { "@type": "ImageObject", url: … }
    return firstString(value['name'] ?? value['url'] ?? null);
  }
  return null;
}

function extractOffer(node: Record<string, unknown>): { price: number; currency: string } | null {
  const offers = node['offers'];
  const candidates: unknown[] = Array.isArray(offers) ? offers : [offers];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;

    const rawPrice = candidate['price'] ?? candidate['lowPrice'];
    const rawCurrency = candidate['priceCurrency'];

    const price =
      typeof rawPrice === 'number'
        ? rawPrice
        : typeof rawPrice === 'string'
          ? Number.parseFloat(rawPrice.replace(/[^0-9.]/g, ''))
          : Number.NaN;

    if (!Number.isFinite(price)) continue;

    return {
      price,
      currency: typeof rawCurrency === 'string' ? rawCurrency.toUpperCase() : 'GBP',
    };
  }

  return null;
}

export function parseJsonLdProduct(html: string): ParsedProduct | null {
  const node = findProductNode(extractJsonLdBlocks(html));
  if (!node) return null;

  const title = firstString(node['name']);
  if (!title) return null;

  const offer = extractOffer(node);

  return {
    title,
    brand: firstString(node['brand']),
    priceMinor: offer ? toMinorUnits(offer.price, offer.currency) : null,
    currency: offer?.currency ?? null,
    imageUrl: firstString(node['image']),
    externalId: firstString(node['sku'] ?? node['productID'] ?? node['mpn']),
    source: 'json-ld',
    raw: node,
  };
}

function metaContent(html: string, property: string): string | null {
  // Attribute order varies, so match either ordering rather than assuming one.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      'i',
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function parseOpenGraphProduct(html: string): ParsedProduct | null {
  const title = metaContent(html, 'og:title');
  if (!title) return null;

  const rawPrice =
    metaContent(html, 'product:price:amount') ?? metaContent(html, 'og:price:amount');
  const currency =
    metaContent(html, 'product:price:currency') ?? metaContent(html, 'og:price:currency');

  const price = rawPrice ? Number.parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : Number.NaN;
  const resolvedCurrency = currency ? currency.toUpperCase() : null;

  return {
    title,
    brand: metaContent(html, 'og:site_name'),
    priceMinor: Number.isFinite(price) ? toMinorUnits(price, resolvedCurrency) : null,
    currency: resolvedCurrency,
    imageUrl: metaContent(html, 'og:image'),
    externalId: null,
    source: 'open-graph',
    raw: { title, rawPrice, currency },
  };
}

/** JSON-LD, then Open Graph, then null — the caller surfaces
 *  `INGEST_UNREADABLE` and offers manual entry. */
export function parseProductPage(html: string): ParsedProduct | null {
  return parseJsonLdProduct(html) ?? parseOpenGraphProduct(html);
}
