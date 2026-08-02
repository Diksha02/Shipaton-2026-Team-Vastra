import { parseProductPage, type ParsedProduct } from './parse';
import { checkIngestUrl, normaliseIngestUrl } from './ssrf';

export * from './parse';
export * from './ssrf';

/**
 * URL ingestion (PROJECT.md §5.3).
 *
 * Only URLs a user explicitly pasted are fetched. One page per request. Never
 * crawl, never enumerate, never follow links found in the document.
 */

export interface IngestLimits {
  timeoutMs: number;
  hardCapMs: number;
  maxBytes: number;
  userAgent: string;
}

export const DEFAULT_INGEST_LIMITS: IngestLimits = {
  timeoutMs: 5_000,
  hardCapMs: 10_000,
  maxBytes: 2 * 1024 * 1024,
  // A contactable User-Agent is basic courtesy and the thing that keeps us off
  // blocklists — a retailer should be able to reach us rather than just ban us.
  userAgent: 'WardrobeBot/1.0 (+https://example.com/bot)',
};

export type IngestFailure =
  | 'blocked_host'
  | 'invalid_url'
  | 'unsupported_scheme'
  | 'credentials_in_url'
  | 'robots_disallowed'
  | 'too_large'
  | 'timeout'
  | 'unreadable'
  | 'http_error';

export type IngestResult =
  | { readonly ok: true; readonly product: ParsedProduct; readonly normalisedUrl: string }
  | { readonly ok: false; readonly reason: IngestFailure };

export interface IngestProvider {
  readonly name: string;
  fetchProduct(rawUrl: string): Promise<IngestResult>;
}

/**
 * Fake backed by an in-memory URL→HTML map.
 *
 * Runs the real URL checks and the real parser — only the network is faked. A
 * fake that skipped validation would let SSRF regressions through the tests
 * that exist to catch them.
 */
export class FakeIngestProvider implements IngestProvider {
  readonly name = 'fake-ingest';

  constructor(private readonly pages: Record<string, string> = {}) {}

  fetchProduct(rawUrl: string): Promise<IngestResult> {
    const check = checkIngestUrl(rawUrl);
    if (!check.ok) {
      return Promise.resolve({ ok: false, reason: check.reason });
    }

    const html = this.pages[rawUrl] ?? this.pages[normaliseIngestUrl(check.url)];
    if (html === undefined) {
      return Promise.resolve({ ok: false, reason: 'http_error' });
    }

    const product = parseProductPage(html);
    if (!product) {
      return Promise.resolve({ ok: false, reason: 'unreadable' });
    }

    return Promise.resolve({
      ok: true,
      product,
      normalisedUrl: normaliseIngestUrl(check.url),
    });
  }
}
