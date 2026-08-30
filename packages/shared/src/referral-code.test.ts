import { describe, expect, it } from 'vitest';
import {
  REFERRAL_ALPHABET,
  REFERRAL_CODE_LENGTH,
  generateReferralCode,
  looksLikeReferralCode,
  normaliseReferralCode,
} from './referral-code';

describe('the alphabet', () => {
  it('excludes every confusable character', () => {
    // The whole point of the alphabet. A code containing both O and 0 cannot be
    // dictated over a phone, and a code containing I and 1 cannot be typed from
    // a screenshot.
    for (const confusable of ['O', '0', 'I', '1', 'L', 'Z', '2', 'S', '5', 'B', '8']) {
      expect(REFERRAL_ALPHABET).not.toContain(confusable);
    }
  });

  it('excludes vowels, so no generated code can spell a word', () => {
    for (const vowel of ['A', 'E', 'I', 'O', 'U']) {
      expect(REFERRAL_ALPHABET).not.toContain(vowel);
    }
  });

  it('has no repeated characters', () => {
    expect(new Set(REFERRAL_ALPHABET).size).toBe(REFERRAL_ALPHABET.length);
  });
});

describe('generating', () => {
  it('produces codes of the right shape', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateReferralCode();
      expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
      expect(looksLikeReferralCode(code)).toBe(true);
    }
  });

  it('never emits a character outside the alphabet, even at the extremes of random()', () => {
    // Math.random() returns [0, 1). A naive implementation that used <= 1 would
    // index off the end and emit `undefined`.
    expect(generateReferralCode(() => 0)).toBe(REFERRAL_ALPHABET[0]!.repeat(REFERRAL_CODE_LENGTH));
    const nearlyOne = generateReferralCode(() => 0.999999);
    expect(nearlyOne).toBe(REFERRAL_ALPHABET.at(-1)!.repeat(REFERRAL_CODE_LENGTH));
    expect(nearlyOne).not.toContain('undefined');
  });
});

describe('normalising', () => {
  it('folds case and strips what people insert when reading aloud', () => {
    expect(normaliseReferralCode(' cd7-fg 9h ')).toBe('CD7FG9H');
    expect(normaliseReferralCode('cd7_fg9h')).toBe('CD7FG9H');
  });

  it('does NOT rewrite confusable characters onto valid ones', () => {
    // The important one. Mapping O→Q would turn a misread into a *different
    // valid code* and credit a stranger's referral. Rejecting is the safe
    // failure; guessing is not.
    expect(normaliseReferralCode('OOOOOOO')).toBe('OOOOOOO');
    expect(looksLikeReferralCode('OOOOOOO')).toBe(false);
    expect(looksLikeReferralCode('1111111')).toBe(false);
  });
});

describe('validating', () => {
  it('rejects wrong lengths', () => {
    expect(looksLikeReferralCode('')).toBe(false);
    expect(looksLikeReferralCode('CD7FG9')).toBe(false);
    expect(looksLikeReferralCode('CD7FG9HJ')).toBe(false);
  });

  it('accepts a real code however it was typed', () => {
    const code = generateReferralCode();
    expect(looksLikeReferralCode(code.toLowerCase())).toBe(true);
    expect(looksLikeReferralCode(`  ${code}  `)).toBe(true);
  });
});
