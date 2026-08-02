import { describe, expect, it } from 'vitest';
import { decideAuxiliaryVerdict, decideNudityVerdict } from './moderation';

/**
 * These tests encode the single most consequential policy decision in the app.
 *
 * PROJECT.md §5.1: this is a fashion app. Swimwear, underwear and activewear
 * are legitimate, expected content. A blunt NSFW classifier destroys the core
 * use case — so the calibration is pinned here, where a regression fails loudly
 * rather than quietly rejecting a user's bikini.
 */
describe('decideNudityVerdict', () => {
  it('passes swimwear and underwear (very_suggestive)', () => {
    expect(decideNudityVerdict({ very_suggestive: 0.94, none: 0.02 })).toBe('pass');
    expect(decideNudityVerdict({ suggestive: 0.81 })).toBe('pass');
  });

  it('passes ordinary clothing', () => {
    expect(decideNudityVerdict({ none: 0.99 })).toBe('pass');
  });

  it('sends erotica to human review rather than rejecting outright', () => {
    expect(decideNudityVerdict({ erotica: 0.72 })).toBe('review');
  });

  it('fails only explicit sexual classes', () => {
    expect(decideNudityVerdict({ sexual_display: 0.66 })).toBe('fail');
    expect(decideNudityVerdict({ sexual_activity: 0.91 })).toBe('fail');
  });

  it('prefers the most severe signal when classes overlap', () => {
    expect(decideNudityVerdict({ very_suggestive: 0.7, sexual_display: 0.8 })).toBe('fail');
    expect(decideNudityVerdict({ very_suggestive: 0.9, erotica: 0.6 })).toBe('review');
  });

  it('treats a missing class as zero rather than throwing', () => {
    expect(decideNudityVerdict({})).toBe('pass');
  });

  it('does not fail just below the threshold', () => {
    expect(decideNudityVerdict({ sexual_display: 0.49 })).toBe('pass');
    expect(decideNudityVerdict({ sexual_display: 0.5 })).toBe('fail');
  });
});

describe('decideAuxiliaryVerdict', () => {
  it('rejects offensive symbols and gore regardless of nudity classes', () => {
    expect(decideAuxiliaryVerdict({ offensive: 0.8 })).toBe('fail');
    expect(decideAuxiliaryVerdict({ gore: 0.7 })).toBe('fail');
  });

  it('returns null when nothing auxiliary applies, deferring to the nudity pass', () => {
    expect(decideAuxiliaryVerdict({ offensive: 0.1, gore: 0.05 })).toBeNull();
    expect(decideAuxiliaryVerdict({})).toBeNull();
  });
});
