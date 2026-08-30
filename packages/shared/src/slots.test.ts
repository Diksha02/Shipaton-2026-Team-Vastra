import { describe, expect, it } from 'vitest';
import {
  BASE_REUSABLE_SLOTS,
  BASE_SINGLE_USE_CREDITS,
  FREE_SLOTS_DEFAULT,
  applyDelete,
  applySave,
  planSlot,
  slotBalance,
  type SlotLedger,
} from './slots';

const fresh: SlotLedger = {
  reusableSlots: BASE_REUSABLE_SLOTS,
  reusableUsed: 0,
  singleUseGranted: BASE_SINGLE_USE_CREDITS,
  singleUseSpent: 0,
};

/** Saves repeatedly until there is no space, returning the sequence of costs. */
function saveUntilFull(start: SlotLedger, isPro = false): { costs: string[]; ledger: SlotLedger } {
  const costs: string[] = [];
  let ledger = start;
  // Bounded so a bug that never fills cannot hang the suite.
  for (let i = 0; i < 50; i += 1) {
    const next = applySave(ledger, isPro);
    if (next === null) break;
    costs.push(next.slot);
    ledger = next.ledger;
  }
  return { costs, ledger };
}

describe('slot planning', () => {
  it('holds five outfits on the free tier', () => {
    expect(FREE_SLOTS_DEFAULT).toBe(5);
    expect(saveUntilFull(fresh).costs).toHaveLength(5);
  });

  it('spends the permanent space before any credit', () => {
    // Getting this order wrong burns a credit while a free space sits empty.
    expect(saveUntilFull(fresh).costs).toEqual([
      'reusable',
      'single_use',
      'single_use',
      'single_use',
      'single_use',
    ]);
  });

  it('refuses a sixth save', () => {
    const { ledger } = saveUntilFull(fresh);
    expect(planSlot(ledger, false)).toBeNull();
    expect(applySave(ledger, false)).toBeNull();
    expect(slotBalance(ledger, false).full).toBe(true);
  });

  it('never runs out for Pro', () => {
    expect(planSlot({ ...fresh, reusableUsed: 999, singleUseSpent: 999 }, true)).toBe('reusable');
    expect(slotBalance(fresh, true).totalLeft).toBeNull();
    expect(slotBalance(fresh, true).full).toBe(false);
  });
});

describe('deleting', () => {
  it('frees a permanent space for re-use, indefinitely', () => {
    let ledger = fresh;
    // Ten cycles through the one permanent space. It must never degrade.
    for (let i = 0; i < 10; i += 1) {
      const saved = applySave(ledger, false);
      expect(saved?.slot).toBe('reusable');
      ledger = applyDelete(saved!.ledger, 'reusable');
    }
    expect(ledger).toEqual(fresh);
    expect(slotBalance(ledger, false).creditsLeft).toBe(BASE_SINGLE_USE_CREDITS);
  });

  it('does not refund a single-use save', () => {
    const { ledger } = saveUntilFull(fresh);
    const after = applyDelete(ledger, 'single_use');
    expect(slotBalance(after, false).creditsLeft).toBe(0);
    // Still full: the credit is gone, and the permanent space is still occupied.
    expect(planSlot(after, false)).toBeNull();
  });

  it('lets a freed permanent space be re-used even when all credits are spent', () => {
    // The escape hatch that keeps the free tier usable forever: someone who has
    // burned every credit can still save, delete and save again in their
    // permanent space. Losing this would make the app read as a paywall.
    const { ledger } = saveUntilFull(fresh);
    const after = applyDelete(ledger, 'reusable');
    expect(planSlot(after, false)).toBe('reusable');
  });
});

describe('grants', () => {
  it('makes referral spaces permanent, not consumable', () => {
    const referred: SlotLedger = { ...fresh, reusableSlots: BASE_REUSABLE_SLOTS + 2 };
    expect(saveUntilFull(referred).costs).toEqual([
      'reusable',
      'reusable',
      'reusable',
      'single_use',
      'single_use',
      'single_use',
      'single_use',
    ]);
  });

  it('lets purchased credits extend a full ledger', () => {
    const { ledger } = saveUntilFull(fresh);
    const topped = { ...ledger, singleUseGranted: ledger.singleUseGranted + 3 };
    expect(slotBalance(topped, false).creditsLeft).toBe(3);
    expect(planSlot(topped, false)).toBe('single_use');
  });
});

describe('corrupt input', () => {
  // A persisted ledger can be edited on a rooted device. It must degrade to
  // "no space", never to negative balances or free saves.
  it('treats negative and non-finite balances as zero', () => {
    const corrupt: SlotLedger = {
      reusableSlots: -5,
      reusableUsed: Number.NaN,
      singleUseGranted: -1,
      singleUseSpent: Number.POSITIVE_INFINITY,
    };
    const balance = slotBalance(corrupt, false);
    expect(balance.creditsLeft).toBe(0);
    expect(balance.reusableFree).toBe(0);
    expect(balance.full).toBe(true);
    expect(planSlot(corrupt, false)).toBeNull();
  });

  it('never reports a negative credit balance when over-spent', () => {
    const over: SlotLedger = { ...fresh, singleUseSpent: 99 };
    expect(slotBalance(over, false).creditsLeft).toBe(0);
  });
});
