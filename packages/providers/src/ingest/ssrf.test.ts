import { describe, expect, it } from 'vitest';
import { checkIngestUrl, isBlockedIpv4, isBlockedIpv6, normaliseIngestUrl } from './ssrf';

describe('isBlockedIpv4', () => {
  it.each([
    ['169.254.169.254', 'cloud metadata endpoint'],
    ['127.0.0.1', 'loopback'],
    ['10.1.2.3', 'RFC1918 /8'],
    ['172.16.0.1', 'RFC1918 /12 lower bound'],
    ['172.31.255.254', 'RFC1918 /12 upper bound'],
    ['192.168.1.1', 'RFC1918 /16'],
    ['100.64.0.1', 'carrier-grade NAT'],
    ['0.0.0.0', 'this network'],
  ])('blocks %s (%s)', (ip) => {
    expect(isBlockedIpv4(ip)).toBe(true);
  });

  it.each([
    ['8.8.8.8'],
    ['1.1.1.1'],
    // Just outside 172.16.0.0/12 in both directions — the boundary most
    // hand-rolled implementations get wrong.
    ['172.15.255.255'],
    ['172.32.0.1'],
  ])('allows public address %s', (ip) => {
    expect(isBlockedIpv4(ip)).toBe(false);
  });
});

describe('isBlockedIpv6', () => {
  it('blocks loopback and link-local', () => {
    expect(isBlockedIpv6('::1')).toBe(true);
    expect(isBlockedIpv6('fe80::1')).toBe(true);
    expect(isBlockedIpv6('fc00::1')).toBe(true);
  });

  it('blocks IPv4-mapped private addresses', () => {
    // Without mapped-address handling this is a one-line bypass of every
    // IPv4 rule.
    expect(isBlockedIpv6('::ffff:169.254.169.254')).toBe(true);
    expect(isBlockedIpv6('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows public IPv6', () => {
    expect(isBlockedIpv6('2606:4700:4700::1111')).toBe(false);
  });
});

describe('checkIngestUrl', () => {
  it('accepts a normal product URL', () => {
    const result = checkIngestUrl('https://shop.example.com/p/123');
    expect(result.ok).toBe(true);
  });

  it('rejects non-http schemes', () => {
    expect(checkIngestUrl('file:///etc/passwd')).toEqual({
      ok: false,
      reason: 'unsupported_scheme',
    });
    expect(checkIngestUrl('gopher://example.com')).toEqual({
      ok: false,
      reason: 'unsupported_scheme',
    });
  });

  it('rejects embedded credentials', () => {
    expect(checkIngestUrl('https://user:pass@example.com/p')).toEqual({
      ok: false,
      reason: 'credentials_in_url',
    });
  });

  it('rejects internal hosts', () => {
    for (const url of [
      'http://localhost:3000/',
      'http://127.0.0.1:55432/',
      'http://169.254.169.254/latest/meta-data/',
      'http://metadata.google.internal/',
      'http://db.internal/',
    ]) {
      expect(checkIngestUrl(url)).toEqual({ ok: false, reason: 'blocked_host' });
    }
  });

  it('rejects malformed input', () => {
    expect(checkIngestUrl('not a url')).toEqual({ ok: false, reason: 'invalid_url' });
  });
});

describe('normaliseIngestUrl', () => {
  it('strips tracking params and fragments so one product caches once', () => {
    const a = normaliseIngestUrl(
      new URL('https://shop.example.com/p/1?utm_source=ig&colour=black#reviews'),
    );
    const b = normaliseIngestUrl(new URL('https://shop.example.com/p/1?colour=black&fbclid=xyz'));
    expect(a).toBe(b);
  });

  it('keeps parameters that identify the product', () => {
    expect(normaliseIngestUrl(new URL('https://shop.example.com/p?id=99'))).toContain('id=99');
  });
});
