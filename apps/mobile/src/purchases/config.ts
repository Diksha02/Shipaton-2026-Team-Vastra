import { Platform } from 'react-native';

/**
 * RevenueCat configuration.
 *
 * PROJECT.md §6 defines the products. This file is the single place the app
 * knows their identifiers, so a rename in the store consoles is a one-line
 * change here rather than a hunt through screens.
 */

/**
 * The entitlement that unlocks everything paid.
 *
 * Must match the entitlement identifier in the RevenueCat dashboard exactly —
 * a typo here fails silently as "user has not purchased", which is the worst
 * possible failure mode because it looks like a business outcome rather than a
 * bug.
 */
export const ENTITLEMENT_PRO = 'Vastra Pro';

/** Product identifiers, as configured in the RevenueCat dashboard. */
export const PRODUCTS = {
  lifetime: 'lifetime',
  yearly: 'yearly',
  monthly: 'monthly',
} as const;

export type ProductKey = keyof typeof PRODUCTS;

/**
 * Placements — where a paywall appears, named.
 *
 * RevenueCat's Targeting lets a different Offering serve each placement, so the
 * paywall someone hits after filling five spaces can price differently from the
 * one they reach browsing the Looks feed. All of it changes in the dashboard,
 * with no app release.
 *
 * That matters here beyond neatness: intent is wildly different at these three
 * moments, and one price for all of them leaves money on the table. Naming them
 * is what makes an experiment possible at all.
 */
export const PLACEMENTS = {
  /** Tried to save a sixth outfit. Highest intent — they built the thing. */
  outfitLimit: 'outfit_limit',
  /** Tapped Plus in the profile. Browsing, not blocked. */
  profileUpsell: 'profile_upsell',
  /** Wanted a premium action inside the feed. */
  looksFeed: 'looks_feed',
} as const;

export type Placement = (typeof PLACEMENTS)[keyof typeof PLACEMENTS];

/**
 * Resolves the SDK key for this platform.
 *
 * Store-specific keys win. The Test Store key is the fallback, so the paywall
 * is exercisable before App Store Connect and Play Console products exist —
 * which matters when the store accounts are the long pole.
 *
 * Public by design: RevenueCat SDK keys are meant to ship in the client. They
 * still come from the environment rather than source, so the value is not in a
 * public repository.
 */
export function resolveApiKey(): string | null {
  const ios = process.env['EXPO_PUBLIC_REVENUECAT_IOS_KEY'];
  const android = process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'];
  const test = process.env['EXPO_PUBLIC_REVENUECAT_TEST_KEY'];

  const platformKey = Platform.select({ ios, android, default: undefined });

  return platformKey?.trim() || test?.trim() || null;
}

/** True when the resolved key is a Test Store key. Surfaced in the UI so a
 *  sandbox purchase is never mistaken for a real one. */
export function isTestStore(): boolean {
  return (resolveApiKey() ?? '').startsWith('test_');
}
