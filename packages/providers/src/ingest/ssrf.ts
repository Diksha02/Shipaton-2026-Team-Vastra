/**
 * SSRF protection for URL ingestion (PROJECT.md §5.3).
 *
 * The user hands us a URL and we fetch it server-side. That is a confused
 * deputy waiting to happen: without these checks, `http://169.254.169.254/`
 * hands an attacker the cloud metadata endpoint, and `http://127.0.0.1:5432/`
 * points our own fetcher at our own database.
 *
 * These are pure functions so the policy is testable without a network.
 */

/** Blocked IPv4 CIDR ranges, as [network, prefix length]. */
const BLOCKED_V4: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // RFC1918 private
  ['100.64.0.0', 10], // RFC6598 carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — cloud metadata lives here
  ['172.16.0.0', 12], // RFC1918 private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // RFC1918 private
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

export function isBlockedIpv4(ip: string): boolean {
  const address = ipv4ToInt(ip);
  if (address === null) return false;

  for (const [network, prefix] of BLOCKED_V4) {
    const base = ipv4ToInt(network);
    if (base === null) continue;
    // >>> 0 keeps the mask unsigned; a /0 shift would otherwise misbehave.
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    if (((address & mask) >>> 0) === ((base & mask) >>> 0)) return true;
  }
  return false;
}

export function isBlockedIpv6(ip: string): boolean {
  const normalised = ip.toLowerCase().replace(/^\[|\]$/g, '');

  if (normalised === '::1' || normalised === '::') return true;
  // fc00::/7 unique-local, fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/.test(normalised)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(normalised)) return true;

  // IPv4-mapped (::ffff:169.254.169.254) must be checked as IPv4, or it becomes
  // a trivial bypass of every rule above.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(normalised);
  if (mapped?.[1]) return isBlockedIpv4(mapped[1]);

  return false;
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', 'metadata']);

/**
 * Hostname-level check, applied before DNS resolution.
 *
 * This is necessary but NOT sufficient: a hostname that looks fine can resolve
 * to a private address. The fetcher must additionally verify the resolved IP
 * before connecting, and re-verify on every redirect hop.
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');

  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    return true;
  }
  if (isBlockedIpv4(host)) return true;
  if (host.includes(':') && isBlockedIpv6(host)) return true;

  return false;
}

export type UrlRejectionReason =
  | 'invalid_url'
  | 'unsupported_scheme'
  | 'blocked_host'
  | 'credentials_in_url';

export type UrlCheck =
  | { readonly ok: true; readonly url: URL }
  | { readonly ok: false; readonly reason: UrlRejectionReason };

/** Validates a user-supplied URL before any network call is attempted. */
export function checkIngestUrl(raw: string): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: 'unsupported_scheme' };
  }

  // Embedded credentials are never legitimate on a public product page and can
  // be used to confuse downstream parsers about the real host.
  if (url.username || url.password) {
    return { ok: false, reason: 'credentials_in_url' };
  }

  if (isBlockedHostname(url.hostname)) {
    return { ok: false, reason: 'blocked_host' };
  }

  return { ok: true, url };
}

/** Cache key for the 24h ingest cache. Strips tracking parameters so the same
 *  product shared from two places is fetched once. */
export function normaliseIngestUrl(url: URL): string {
  const normalised = new URL(url.toString());
  normalised.hash = '';

  const strip = [...normalised.searchParams.keys()].filter(
    (key) => key.startsWith('utm_') || ['fbclid', 'gclid', 'ref', 'referrer'].includes(key),
  );
  for (const key of strip) normalised.searchParams.delete(key);
  normalised.searchParams.sort();

  return normalised.toString();
}
