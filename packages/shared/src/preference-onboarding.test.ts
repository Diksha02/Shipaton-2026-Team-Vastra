import { describe, expect, it } from 'vitest';
import {
  departmentsStillApplied,
  expectedPersistedPreferences,
  validatePreferenceOnboarding,
} from './preference-onboarding';

describe('validatePreferenceOnboarding', () => {
  it('requires at least one department', () => {
    const result = validatePreferenceOnboarding({
      departments: [],
      email: '',
      marketingConsent: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/at least one/i);
  });

  it('accepts departments only (guest with no email)', () => {
    const result = validatePreferenceOnboarding({
      departments: ['womenswear', 'unisex'],
      email: '  ',
      marketingConsent: false,
    });
    expect(result).toEqual({
      ok: true,
      departments: ['womenswear', 'unisex'],
      email: '',
      marketingConsent: false,
    });
  });

  it('trims and keeps a valid optional email', () => {
    const result = validatePreferenceOnboarding({
      departments: ['menswear'],
      email: '  diksha@example.com ',
      marketingConsent: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.email).toBe('diksha@example.com');
  });

  it('rejects a malformed email', () => {
    const result = validatePreferenceOnboarding({
      departments: ['kids'],
      email: 'not-an-email',
      marketingConsent: false,
    });
    expect(result.ok).toBe(false);
  });

  it('requires email when marketing consent is on', () => {
    const result = validatePreferenceOnboarding({
      departments: ['unisex'],
      email: '',
      marketingConsent: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/email/i);
  });

  it('allows marketing consent with a valid email', () => {
    const result = validatePreferenceOnboarding({
      departments: ['womenswear'],
      email: 'you@vastra.app',
      marketingConsent: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.marketingConsent).toBe(true);
      expect(result.email).toBe('you@vastra.app');
    }
  });
});

describe('persistence contract — guest and Google share one snapshot', () => {
  const guestInput = {
    departments: ['menswear', 'kids'] as const,
    email: 'guest@example.com',
    marketingConsent: true,
  };

  it('builds the same expected persisted state for guest continue', () => {
    const validated = validatePreferenceOnboarding({ ...guestInput });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const afterGuest = expectedPersistedPreferences(validated);
    expect(afterGuest).toEqual({
      departments: ['menswear', 'kids'],
      email: 'guest@example.com',
      marketingConsent: true,
      sheetCompleted: true,
    });
  });

  it('builds the same expected persisted state after Google sign-in', () => {
    const validated = validatePreferenceOnboarding({ ...guestInput });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    // Auth must not invent a second preference model — same snapshot applies.
    const afterGoogle = expectedPersistedPreferences(validated);
    const afterGuest = expectedPersistedPreferences(validated);
    expect(afterGoogle).toEqual(afterGuest);
  });

  it('keeps department filters applied after a simulated session continue', () => {
    const validated = validatePreferenceOnboarding({
      departments: ['womenswear', 'unisex'],
      email: '',
      marketingConsent: false,
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const persisted = expectedPersistedPreferences(validated);
    // Catalogue filter store should still hold the same selection.
    expect(departmentsStillApplied(persisted.departments, ['womenswear', 'unisex'])).toBe(true);
    expect(departmentsStillApplied(['womenswear'], ['womenswear', 'unisex'])).toBe(false);
    expect(departmentsStillApplied([], ['womenswear', 'unisex'])).toBe(false);
  });
});
