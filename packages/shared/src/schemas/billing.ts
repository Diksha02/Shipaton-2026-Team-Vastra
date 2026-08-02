import { z } from 'zod';
import { entitlementKindSchema, productIdSchema } from '../enums';
import { uuidSchema } from '../ids';

/**
 * What the client is allowed to know about its own entitlements.
 *
 * The client never computes this. It reads it from our API, which derives it
 * from our database, which is populated from verified RevenueCat webhooks
 * (PROJECT.md §5.4). A client that decides locally what it has paid for is a
 * client that can be told to lie.
 */
export const entitlementStateSchema = z.object({
  /** True while the `plus` entitlement is active. */
  plus: z.boolean(),
  plusExpiresAt: z.string().datetime().nullable(),
  slotsTotal: z.number().int().nonnegative(),
  slotsUsed: z.number().int().nonnegative(),
});

export type EntitlementState = z.infer<typeof entitlementStateSchema>;

export const entitlementSchema = z.object({
  id: uuidSchema,
  productId: productIdSchema,
  kind: entitlementKindSchema,
  slotsGranted: z.number().int().positive().nullable(),
  expiresAt: z.string().datetime().nullable(),
  grantedAt: z.string().datetime(),
});

export type Entitlement = z.infer<typeof entitlementSchema>;

/**
 * Minimal RevenueCat webhook envelope — only the fields we act on.
 *
 * `id` is the RevenueCat event id and is stored as `entitlements.rc_event_id`
 * with a UNIQUE constraint, which is what makes replay idempotent. RevenueCat
 * retries on non-2xx, so replays are expected traffic, not an edge case.
 */
export const revenueCatWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  app_user_id: z.string().min(1),
  product_id: z.string().min(1),
  /** Milliseconds since epoch. */
  purchased_at_ms: z.number().int().optional(),
  expiration_at_ms: z.number().int().nullable().optional(),
  environment: z.enum(['SANDBOX', 'PRODUCTION']).optional(),
  price_in_purchased_currency: z.number().optional(),
  currency: z.string().length(3).optional(),
});

export type RevenueCatWebhookEvent = z.infer<typeof revenueCatWebhookEventSchema>;

export const revenueCatWebhookBodySchema = z.object({
  event: revenueCatWebhookEventSchema,
  api_version: z.string().optional(),
});

export type RevenueCatWebhookBody = z.infer<typeof revenueCatWebhookBodySchema>;

/**
 * Paywall analytics events (PROJECT.md §6: every view/dismiss/purchase is a
 * PostHog event). Named here so the app and the API cannot disagree about the
 * event name — a renamed event is a silently broken funnel.
 */
export const PAYWALL_EVENTS = {
  viewed: 'paywall_viewed',
  dismissed: 'paywall_dismissed',
  purchaseStarted: 'paywall_purchase_started',
  purchaseCompleted: 'paywall_purchase_completed',
  purchaseFailed: 'paywall_purchase_failed',
  restoreStarted: 'paywall_restore_started',
} as const;

export type PaywallEvent = (typeof PAYWALL_EVENTS)[keyof typeof PAYWALL_EVENTS];
