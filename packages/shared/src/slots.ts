import { z } from 'zod';

/**
 * Outfit spaces — the free tier's scarcity mechanic.
 *
 * Two kinds of space, and the difference is only what happens *after* a delete:
 *
 *   `reusable`   — a permanent space. Save, delete, save again, forever.
 *   `single_use` — a credit, spent at the moment of saving. Deleting the outfit
 *                  removes it immediately and for free, but does not return the
 *                  credit.
 *
 * PROJECT.md §4, and this is the load-bearing sentence: **deletion is never
 * gated, delayed, or priced.** The cost attaches to *creating* a saved outfit,
 * never to removing one, which is what keeps the right to erasure (UK GDPR
 * Art. 17) untouched. A design where a user must pay to delete their own data
 * is unlawful here — do not "improve" this into one.
 *
 * This module is deliberately pure and shared. The client runs it to *predict*
 * what a save will cost so it can say so before the user commits; the server
 * runs it to *enforce*. Same rule, one implementation, so the two can never
 * disagree about what someone was charged.
 */

export const SLOT_KINDS = ['reusable', 'single_use'] as const;
export const slotKindSchema = z.enum(SLOT_KINDS);
export type SlotKind = z.infer<typeof slotKindSchema>;

/** Why a space was granted. Append-only audit — every number a user sees must
 *  be explainable back to one of these. */
export const SLOT_GRANT_REASONS = ['signup', 'referral', 'purchase', 'promo', 'support'] as const;
export const slotGrantReasonSchema = z.enum(SLOT_GRANT_REASONS);
export type SlotGrantReason = z.infer<typeof slotGrantReasonSchema>;

/** One permanent space on signup. */
export const BASE_REUSABLE_SLOTS = 1;
/** Plus four single-use saves, so the free tier still holds five outfits. */
export const BASE_SINGLE_USE_CREDITS = 4;
/** A successful referral converts scarcity into permanence — the reward people
 *  actually want, and the reason to invite anyone. */
export const REFERRAL_REUSABLE_GRANT = 2;
/** Ceiling on referral-earned permanent spaces, so the free tier stays a free
 *  tier rather than an invite-farming exercise. */
export const REFERRAL_REUSABLE_CAP = 6;

/** What the free tier holds in total before anything is spent. Derived, not a
 *  separate knob — changing either base above changes this. */
export const FREE_SLOTS_DEFAULT = BASE_REUSABLE_SLOTS + BASE_SINGLE_USE_CREDITS;

/** Everything needed to decide whether a save can happen and what it costs. */
export interface SlotLedger {
  /** Permanent spaces owned. Grows by referral and by purchase. */
  reusableSlots: number;
  /** Permanent spaces currently holding an outfit. */
  reusableUsed: number;
  /** Single-use saves ever granted. */
  singleUseGranted: number;
  /**
   * Single-use saves ever spent.
   *
   * Counted separately from surviving outfits on purpose: a deleted outfit must
   * still count as spent, and we must be able to say so *without keeping the
   * outfit*. Retaining someone's data purely to run a counter would defeat the
   * erasure right this whole design exists to protect.
   */
  singleUseSpent: number;
}

export interface SlotBalance extends SlotLedger {
  /** Permanent spaces free right now. */
  reusableFree: number;
  /** Unspent single-use saves. */
  creditsLeft: number;
  /** Total outfits that could still be saved. Null when unlimited. */
  totalLeft: number | null;
  /** What the next save would take, or null if it cannot happen. */
  nextSlot: SlotKind | null;
  /** No space of either kind. The one moment a paywall may appear (§6). */
  full: boolean;
  /** Pro, so none of the above ceilings apply. */
  unlimited: boolean;
}

function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Which space the next save would take, or null if there is none.
 *
 * Permanent spaces are always preferred, so a credit is never burned while a
 * free permanent space sits empty. Getting this backwards would silently cost
 * users credits they did not need to spend.
 */
export function planSlot(ledger: SlotLedger, isPro: boolean): SlotKind | null {
  if (isPro) return 'reusable';
  if (clampNonNegative(ledger.reusableUsed) < clampNonNegative(ledger.reusableSlots)) {
    return 'reusable';
  }
  if (clampNonNegative(ledger.singleUseGranted) > clampNonNegative(ledger.singleUseSpent)) {
    return 'single_use';
  }
  return null;
}

/** The full picture, for a screen that has to explain the state rather than
 *  just act on it. */
export function slotBalance(ledger: SlotLedger, isPro: boolean): SlotBalance {
  const reusableSlots = clampNonNegative(ledger.reusableSlots);
  const reusableUsed = clampNonNegative(ledger.reusableUsed);
  const singleUseGranted = clampNonNegative(ledger.singleUseGranted);
  const singleUseSpent = clampNonNegative(ledger.singleUseSpent);

  const normalised: SlotLedger = { reusableSlots, reusableUsed, singleUseGranted, singleUseSpent };

  const reusableFree = Math.max(0, reusableSlots - reusableUsed);
  const creditsLeft = Math.max(0, singleUseGranted - singleUseSpent);
  const nextSlot = planSlot(normalised, isPro);

  return {
    ...normalised,
    reusableFree,
    creditsLeft,
    totalLeft: isPro ? null : reusableFree + creditsLeft,
    nextSlot,
    full: nextSlot === null,
    unlimited: isPro,
  };
}

/**
 * The ledger after a save. Pure, so the same transition can be asserted in a
 * test, applied optimistically on the client, and committed on the server.
 *
 * Returns null when there was no space — the caller must not invent one.
 */
export function applySave(
  ledger: SlotLedger,
  isPro: boolean,
): { ledger: SlotLedger; slot: SlotKind } | null {
  const slot = planSlot(ledger, isPro);
  if (slot === null) return null;

  if (slot === 'reusable') {
    return { ledger: { ...ledger, reusableUsed: ledger.reusableUsed + 1 }, slot };
  }
  return { ledger: { ...ledger, singleUseSpent: ledger.singleUseSpent + 1 }, slot };
}

/**
 * The ledger after a delete.
 *
 * A permanent space is released. A single-use save is *not* refunded — but note
 * what does not appear here: no entitlement check, no eligibility test, no way
 * for this to fail. Deletion always succeeds.
 */
export function applyDelete(ledger: SlotLedger, slot: SlotKind): SlotLedger {
  if (slot === 'reusable') {
    return { ...ledger, reusableUsed: Math.max(0, ledger.reusableUsed - 1) };
  }
  return ledger;
}
