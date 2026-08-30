/**
 * Drizzle schema — PROJECT.md §4.
 *
 * Conventions applied uniformly:
 *   - ids are UUID v7, generated in application code (`newId`), never by a
 *     column default: Postgres 16 has no native `uuidv7()`.
 *   - every table carries `created_at` and `updated_at`.
 *   - user-owned rows carry `deleted_at` for soft delete. Hard delete happens
 *     only on account deletion.
 *
 * Enum values are imported from `@vastra/shared` rather than retyped, so the
 * database and the API cannot drift.
 */
import {
  ASSET_KINDS,
  BASE_REUSABLE_SLOTS,
  BASE_SINGLE_USE_CREDITS,
  ENTITLEMENT_KINDS,
  ITEM_CATEGORIES,
  ITEM_COLOURS,
  DEPARTMENTS,
  ITEM_SOURCES,
  MODERATION_STATUSES,
  MODERATION_VERDICTS,
  OUTFIT_STATUSES,
  SLOT_GRANT_REASONS,
  SLOT_KINDS,
  TAGGING_STATUSES,
  TRYON_STATUSES,
} from '@vastra/shared';
import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  index as pgIndex,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// --- enums -----------------------------------------------------------------

export const assetKindEnum = pgEnum('asset_kind', ASSET_KINDS);
export const moderationStatusEnum = pgEnum('moderation_status', MODERATION_STATUSES);
export const moderationVerdictEnum = pgEnum('moderation_verdict', MODERATION_VERDICTS);
export const itemSourceEnum = pgEnum('item_source', ITEM_SOURCES);
export const itemCategoryEnum = pgEnum('item_category', ITEM_CATEGORIES);
export const itemColourEnum = pgEnum('item_colour', ITEM_COLOURS);
export const departmentEnum = pgEnum('department', DEPARTMENTS);
export const taggingStatusEnum = pgEnum('tagging_status', TAGGING_STATUSES);
export const outfitStatusEnum = pgEnum('outfit_status', OUTFIT_STATUSES);
export const tryonStatusEnum = pgEnum('tryon_status', TRYON_STATUSES);
export const entitlementKindEnum = pgEnum('entitlement_kind', ENTITLEMENT_KINDS);
export const slotKindEnum = pgEnum('slot_kind', SLOT_KINDS);
export const slotGrantReasonEnum = pgEnum('slot_grant_reason', SLOT_GRANT_REASONS);

// --- shared column builders ------------------------------------------------

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const deletedAt = timestamp('deleted_at', { withTimezone: true });

// --- users -----------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    /** Firebase Auth `uid`. The only identity claim we trust, and it arrives on
     *  every request as a verified ID token — never as a request body field. */
    firebaseUid: text('firebase_uid').notNull(),
    /**
     * SHA-256 of the E.164 phone number, peppered server-side. Enforces one
     * account per number (F1) without storing a number we would then have to
     * protect. Never reversible to a contact.
     *
     * Nullable: Firebase sign-in with Apple or Google yields no phone number, so
     * F1 can only be enforced for accounts that actually have one. The unique
     * index below is partial for exactly that reason.
     */
    phoneHash: text('phone_hash'),
    handle: text('handle').notNull(),
    avatarAssetId: uuid('avatar_asset_id'),
    /** Explicit consent to AI processing of the avatar. Null ⇒ try-on blocked. */
    avatarConsentAt: timestamp('avatar_consent_at', { withTimezone: true }),

    /**
     * Outfit spaces. The rule these three feed is in `@vastra/shared/slots` and
     * is unit-tested there; this is only where the numbers live.
     *
     * `singleUseSpent` is never decremented. That is deliberate: a spent credit
     * stays spent, which is what lets a deleted outfit be removed *completely*
     * rather than retained to keep a counter honest.
     */
    reusableSlots: integer('reusable_slots').notNull().default(BASE_REUSABLE_SLOTS),
    singleUseGranted: integer('single_use_granted').notNull().default(BASE_SINGLE_USE_CREDITS),
    singleUseSpent: integer('single_use_spent').notNull().default(0),

    /** Short, shareable, case-insensitive. What a referral link carries. */
    referralCode: text('referral_code').notNull(),

    createdAt,
    updatedAt,
    deletedAt,
  },
  (t) => [
    uniqueIndex('users_firebase_uid_key').on(t.firebaseUid),
    uniqueIndex('users_phone_hash_key')
      .on(t.phoneHash)
      .where(sql`${t.phoneHash} IS NOT NULL`),
    uniqueIndex('users_handle_key').on(t.handle),
    uniqueIndex('users_referral_code_key').on(t.referralCode),
    /** Balances must never go negative, whatever a caller believes. */
    check(
      'users_slot_ledger_non_negative',
      sql`${t.reusableSlots} >= 0 AND ${t.singleUseGranted} >= 0 AND ${t.singleUseSpent} >= 0`,
    ),
  ],
);

// --- assets ----------------------------------------------------------------

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey(),
    /** Null for catalogue assets, which belong to no user. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull(),
    mime: text('mime').notNull(),
    width: integer('width'),
    height: integer('height'),
    bytes: bigint('bytes', { mode: 'number' }),
    sha256: char('sha256', { length: 64 }).notNull(),
    kind: assetKindEnum('kind').notNull(),
    moderationStatus: moderationStatusEnum('moderation_status').notNull().default('pending'),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (t) => [
    uniqueIndex('assets_r2_key_key').on(t.r2Key),
    /** Lets an identical re-upload by the same user short-circuit the pipeline. */
    pgIndex('assets_user_sha_idx').on(t.userId, t.sha256),
    pgIndex('assets_moderation_status_idx').on(t.moderationStatus),
  ],
);

// --- moderation ------------------------------------------------------------

export const moderationResults = pgTable(
  'moderation_results',
  {
    id: uuid('id').primaryKey(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    verdict: moderationVerdictEnum('verdict').notNull(),
    /** Per-class scores, so a threshold change can be re-evaluated against
     *  history without re-submitting images to the provider. */
    scores: jsonb('scores').$type<Record<string, number>>().notNull().default({}),
    raw: jsonb('raw').$type<unknown>(),
    decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt,
    updatedAt,
  },
  (t) => [pgIndex('moderation_results_asset_idx').on(t.assetId)],
);

// --- items -----------------------------------------------------------------

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey(),
    source: itemSourceEnum('source').notNull(),
    /** Null for catalogue items. */
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
    brand: text('brand'),
    externalId: text('external_id'),
    title: text('title').notNull(),
    priceMinor: integer('price_minor'),
    currency: char('currency', { length: 3 }),
    productUrl: text('product_url'),
    affiliateUrl: text('affiliate_url'),
    primaryAssetId: uuid('primary_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    category: itemCategoryEnum('category').notNull().default('other'),
    /** Retail section, not a claim about the shopper. `unisex` is a real
     *  department and is returned for every filter — see `matchesDepartments`. */
    department: departmentEnum('department').notNull().default('unisex'),
    subcategory: text('subcategory'),
    colourPrimary: itemColourEnum('colour_primary'),
    attributes: jsonb('attributes').$type<Record<string, unknown>>().notNull().default({}),
    /**
     * The untouched provider payload, kept forever (PROJECT.md §4). Lets us
     * re-normalise a taxonomy change without re-fetching a retailer page we may
     * no longer be allowed to fetch.
     */
    raw: jsonb('raw').$type<unknown>(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }),
    taggingStatus: taggingStatusEnum('tagging_status').notNull().default('pending'),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (t) => [
    /**
     * PROJECT.md §4: UNIQUE (source, brand, external_id) WHERE external_id IS NOT NULL.
     * Partial, because user photos have no external id and would otherwise all
     * collide on (user_photo, null, null).
     */
    uniqueIndex('items_source_brand_external_key')
      .on(t.source, t.brand, t.externalId)
      .where(sql`${t.externalId} IS NOT NULL`),
    pgIndex('items_owner_idx').on(t.ownerUserId, t.deletedAt),
    pgIndex('items_category_idx').on(t.category),
    pgIndex('items_department_idx').on(t.department),
    pgIndex('items_colour_idx').on(t.colourPrimary),
  ],
);

// --- outfits ---------------------------------------------------------------

export const outfits = pgTable(
  'outfits',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    /** `finalised` outfits are immutable in composition — but always deletable. */
    status: outfitStatusEnum('status').notNull().default('draft'),
    /**
     * Which kind of space this outfit consumed, fixed at save time.
     *
     * Needed on delete: releasing a permanent space and declining to refund a
     * single-use credit are different transitions, and the row itself is the
     * only record of which one applies.
     */
    slotKind: slotKindEnum('slot_kind').notNull().default('reusable'),
    coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    finalisedAt: timestamp('finalised_at', { withTimezone: true }),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (t) => [pgIndex('outfits_user_idx').on(t.userId, t.deletedAt)],
);

export const outfitItems = pgTable(
  'outfit_items',
  {
    outfitId: uuid('outfit_id')
      .notNull()
      .references(() => outfits.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.outfitId, t.itemId] }),
    uniqueIndex('outfit_items_position_key').on(t.outfitId, t.position),
  ],
);

// --- slot grants -----------------------------------------------------------

/**
 * Every space a user has ever been given, and why. Append-only.
 *
 * The balances on `users` are what the app reads; this table is what makes them
 * *explainable*. When someone asks why they have three permanent spaces, the
 * answer has to be reconstructable from rows rather than asserted.
 *
 * `rcEventId` carries the idempotency for purchases: RevenueCat retries on any
 * non-2xx, so duplicate deliveries are normal traffic and must never
 * double-grant. It is null for signup and referral grants, hence the partial
 * unique index — an unconditional one would collide every non-purchase row.
 */
export const slotGrants = pgTable(
  'slot_grants',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: slotKindEnum('kind').notNull(),
    /** Always positive. Revocations are a separate concern and not supported. */
    amount: integer('amount').notNull(),
    reason: slotGrantReasonEnum('reason').notNull(),
    /** The referral that produced this grant, when `reason = 'referral'`. */
    referralId: uuid('referral_id'),
    rcEventId: text('rc_event_id'),
    productId: text('product_id'),
    createdAt,
    updatedAt,
  },
  (t) => [
    pgIndex('slot_grants_user_idx').on(t.userId),
    uniqueIndex('slot_grants_rc_event_id_key')
      .on(t.rcEventId)
      .where(sql`${t.rcEventId} IS NOT NULL`),
    check('slot_grants_amount_positive', sql`${t.amount} > 0`),
  ],
);

// --- referrals -------------------------------------------------------------

/**
 * One reward per referred account, enforced by the database rather than by
 * application care. `referredUserId` is UNIQUE — a new account can be credited
 * to exactly one referrer, once, forever.
 *
 * `rewardedAt` is set only after the referred account clears whatever
 * qualification we require, so creating an account is not itself the payout.
 * Without that, the cheapest way to farm permanent spaces is a burner email.
 */
export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey(),
    referrerUserId: uuid('referrer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredUserId: uuid('referred_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The code as typed, kept for support questions. */
    code: text('code').notNull(),
    rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('referrals_referred_user_key').on(t.referredUserId),
    pgIndex('referrals_referrer_idx').on(t.referrerUserId),
    /** Referring yourself is the first thing anyone tries. */
    check('referrals_no_self_referral', sql`${t.referrerUserId} <> ${t.referredUserId}`),
  ],
);

// --- try-on cache ----------------------------------------------------------

/**
 * PROJECT.md §5.2. `cacheKey` is
 *   sha256(avatar_asset_id + ':' + sorted(item_ids).join(',') + ':' + MODEL_VERSION)
 *
 * Lookup before any provider call. A hit costs nothing and returns instantly,
 * which is what makes "free try-on, any time" economically honest: cost scales
 * with unique outfits created, not with taps.
 */
export const tryonRenders = pgTable(
  'tryon_renders',
  {
    id: uuid('id').primaryKey(),
    cacheKey: char('cache_key', { length: 64 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    outfitId: uuid('outfit_id')
      .notNull()
      .references(() => outfits.id, { onDelete: 'cascade' }),
    avatarAssetId: uuid('avatar_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    resultAssetId: uuid('result_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    modelVersion: text('model_version').notNull(),
    status: tryonStatusEnum('status').notNull().default('pending'),
    /** Real provider cost in minor units, so COGS is reportable rather than
     *  estimated. */
    costMinor: integer('cost_minor'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('tryon_renders_cache_key_key').on(t.cacheKey),
    pgIndex('tryon_renders_user_idx').on(t.userId),
  ],
);

// --- entitlements ----------------------------------------------------------

/**
 * RevenueCat is the source of truth for purchases; this table is the source of
 * truth for slots granted (PROJECT.md §5.4).
 *
 * `rcEventId` is UNIQUE, which is the whole idempotency story: RevenueCat
 * retries on any non-2xx, so duplicate deliveries are normal traffic and must
 * never double-grant.
 */
export const entitlements = pgTable(
  'entitlements',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull(),
    kind: entitlementKindEnum('kind').notNull(),
    slotsGranted: integer('slots_granted'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rcEventId: text('rc_event_id').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('entitlements_rc_event_id_key').on(t.rcEventId),
    pgIndex('entitlements_user_idx').on(t.userId),
  ],
);

// --- taxonomy --------------------------------------------------------------

/** Maps provider category vocabularies onto ours. `reviewed` marks a mapping a
 *  human has confirmed, so unreviewed guesses can be audited later. */
export const taxonomyMap = pgTable(
  'taxonomy_map',
  {
    source: text('source').notNull(),
    sourceValue: text('source_value').notNull(),
    ourCategory: itemCategoryEnum('our_category').notNull(),
    ourSubcategory: text('our_subcategory'),
    reviewed: boolean('reviewed').notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.source, t.sourceValue] })],
);

// --- relations -------------------------------------------------------------

export const usersRelations = relations(users, ({ many, one }) => ({
  assets: many(assets),
  outfits: many(outfits),
  slotGrants: many(slotGrants),
  entitlements: many(entitlements),
  avatar: one(assets, { fields: [users.avatarAssetId], references: [assets.id] }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(users, { fields: [items.ownerUserId], references: [users.id] }),
  primaryAsset: one(assets, { fields: [items.primaryAssetId], references: [assets.id] }),
  outfitItems: many(outfitItems),
}));

export const outfitsRelations = relations(outfits, ({ one, many }) => ({
  user: one(users, { fields: [outfits.userId], references: [users.id] }),
  coverAsset: one(assets, { fields: [outfits.coverAssetId], references: [assets.id] }),
  outfitItems: many(outfitItems),
  renders: many(tryonRenders),
}));

export const outfitItemsRelations = relations(outfitItems, ({ one }) => ({
  outfit: one(outfits, { fields: [outfitItems.outfitId], references: [outfits.id] }),
  item: one(items, { fields: [outfitItems.itemId], references: [items.id] }),
}));

export const slotGrantsRelations = relations(slotGrants, ({ one }) => ({
  user: one(users, { fields: [slotGrants.userId], references: [users.id] }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerUserId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referred: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: 'referred',
  }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
  moderationResults: many(moderationResults),
}));
