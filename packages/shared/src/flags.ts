import { z } from 'zod';

/**
 * Feature flags (PROJECT.md §7). Each of these must be independently killable
 * at runtime, because each fronts a third-party provider that can fail
 * independently:
 *
 *   tryon      — FASHN.ai
 *   urlIngest  — outbound fetches of retailer pages
 *   catalogue  — the seeded Discover catalogue
 *
 * Killing a flag degrades one feature. It must never take down the app: the
 * wardrobe, the outfit builder and purchases all keep working with all three
 * flags off.
 */
export const featureFlagsSchema = z.object({
  tryon: z.boolean().default(true),
  urlIngest: z.boolean().default(true),
  catalogue: z.boolean().default(true),
});

export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export const FLAG_KEYS = ['tryon', 'urlIngest', 'catalogue'] as const satisfies readonly (keyof FeatureFlags)[];

export type FlagKey = (typeof FLAG_KEYS)[number];

/** Safe defaults for a cold start before remote config resolves. Everything on:
 *  a flag is a kill switch we reach for, not a rollout gate we wait on. */
export const DEFAULT_FLAGS: Readonly<FeatureFlags> = Object.freeze({
  tryon: true,
  urlIngest: true,
  catalogue: true,
});
