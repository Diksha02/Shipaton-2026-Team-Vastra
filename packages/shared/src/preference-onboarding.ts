import { z } from 'zod';
import { departmentSchema, type Department } from './enums';

/**
 * Preference onboarding payload — what must survive guest browsing and a later
 * Google sign-in on the same device. Departments are applied to the existing
 * catalogue filter; email/marketing live in the preferences store.
 */
export const preferenceOnboardingSchema = z.object({
  departments: z.array(departmentSchema).min(1),
  email: z.string(),
  marketingConsent: z.boolean(),
});

export type PreferenceOnboardingInput = z.infer<typeof preferenceOnboardingSchema>;

export interface PreferenceValidationOk {
  ok: true;
  departments: Department[];
  email: string;
  marketingConsent: boolean;
}

export interface PreferenceValidationErr {
  ok: false;
  message: string;
}

export type PreferenceValidationResult = PreferenceValidationOk | PreferenceValidationErr;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the preference sheet before guest or Google continue.
 * Same rules for both paths so persistence cannot diverge by entry point.
 */
export function validatePreferenceOnboarding(input: {
  departments: readonly Department[];
  email: string;
  marketingConsent: boolean;
}): PreferenceValidationResult {
  if (input.departments.length === 0) {
    return {
      ok: false,
      message: 'Pick at least one option so we know what to show you.',
    };
  }

  const email = input.email.trim();
  if (email.length > 0 && !EMAIL_RE.test(email)) {
    return { ok: false, message: 'That email does not look right.' };
  }

  if (input.marketingConsent && email.length === 0) {
    return {
      ok: false,
      message: 'Add an email if you want tips and offers, or untick the box.',
    };
  }

  return {
    ok: true,
    departments: [...input.departments],
    email,
    marketingConsent: input.marketingConsent,
  };
}

/**
 * What must still be true after continuing as guest or signing in with Google.
 * Used by tests to assert both paths leave the same durable state shape.
 */
export function expectedPersistedPreferences(valid: PreferenceValidationOk): {
  departments: Department[];
  email: string;
  marketingConsent: boolean;
  sheetCompleted: true;
} {
  return {
    departments: valid.departments,
    email: valid.email,
    marketingConsent: valid.marketingConsent,
    sheetCompleted: true,
  };
}

/**
 * Filters should still match onboarding departments after navigation / reload.
 * Empty selected departments would mean "show everything" and fail the contract.
 */
export function departmentsStillApplied(
  selected: readonly Department[],
  expected: readonly Department[],
): boolean {
  if (expected.length === 0) return false;
  if (selected.length !== expected.length) return false;
  const set = new Set(selected);
  return expected.every((d) => set.has(d));
}
