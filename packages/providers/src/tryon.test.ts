import { describe, expect, it } from 'vitest';
import { tryonCacheKey } from './tryon';

/**
 * The cache is the economics of try-on (PROJECT.md §5.2) — cost scales with
 * unique outfits, not with taps. Every property below is load-bearing for that
 * claim, so each is pinned.
 */
describe('tryonCacheKey', () => {
  const avatar = 'avatar-1';
  const items = ['item-b', 'item-a', 'item-c'];

  it('is stable for identical input', () => {
    expect(tryonCacheKey(avatar, items, 'v1')).toBe(tryonCacheKey(avatar, items, 'v1'));
  });

  it('ignores item order — the same garments are the same outfit to the model', () => {
    expect(tryonCacheKey(avatar, ['item-a', 'item-b', 'item-c'], 'v1')).toBe(
      tryonCacheKey(avatar, ['item-c', 'item-a', 'item-b'], 'v1'),
    );
  });

  it('does not mutate the caller’s array while sorting', () => {
    const input = ['item-b', 'item-a'];
    tryonCacheKey(avatar, input, 'v1');
    expect(input).toEqual(['item-b', 'item-a']);
  });

  it('changes when the avatar changes', () => {
    expect(tryonCacheKey('avatar-2', items, 'v1')).not.toBe(tryonCacheKey(avatar, items, 'v1'));
  });

  it('changes when composition changes', () => {
    expect(tryonCacheKey(avatar, ['item-a'], 'v1')).not.toBe(
      tryonCacheKey(avatar, ['item-a', 'item-b'], 'v1'),
    );
  });

  it('changes when the model version is bumped, invalidating every entry', () => {
    expect(tryonCacheKey(avatar, items, 'v2')).not.toBe(tryonCacheKey(avatar, items, 'v1'));
  });

  it('is a hex sha256', () => {
    expect(tryonCacheKey(avatar, items, 'v1')).toMatch(/^[a-f0-9]{64}$/);
  });
});
