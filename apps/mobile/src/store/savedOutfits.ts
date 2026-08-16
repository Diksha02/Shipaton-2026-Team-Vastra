import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_REUSABLE_SLOTS,
  BASE_SINGLE_USE_CREDITS,
  applyDelete,
  applySave,
  slotBalance,
  type SlotBalance,
  type SlotKind,
  type SlotLedger,
} from '@vastra/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STUDIO_LAYERS, type StudioLayer } from '../mock/data';
import type { OutfitLayers } from './outfit';

export type { SlotKind } from '@vastra/shared';

export interface SavedOutfit {
  id: string;
  name: string;
  layers: OutfitLayers;
  savedAt: string;
  /** Which kind of space this outfit occupies. Fixed at save time. */
  slot: SlotKind;
}

export type SaveResult =
  | { ok: true; outfit: SavedOutfit; slot: SlotKind; creditsLeft: number }
  | { ok: false; reason: 'too_few_pieces' | 'no_space' };

interface SavedOutfitsState {
  outfits: SavedOutfit[];
  /** Permanent spaces owned. Grows by referral, and by purchase. */
  reusableSlots: number;
  /** Single-use saves ever granted. */
  singleUseGranted: number;
  /** Single-use saves ever spent. Never decremented — see `remove`. */
  singleUseSpent: number;
  hydrated: boolean;

  save: (layers: OutfitLayers, name: string, isPro: boolean) => SaveResult;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;

  /** Referral reward, or a purchased permanent-slot pack. */
  grantReusableSlots: (count: number) => void;
  /** A purchased credit pack. Mirrors a RevenueCat Virtual Currency balance. */
  grantSingleUseCredits: (count: number) => void;
}

function countPieces(layers: OutfitLayers): number {
  return STUDIO_LAYERS.filter((layer: StudioLayer) => layers[layer]).length;
}

function ledgerOf(state: {
  outfits: SavedOutfit[];
  reusableSlots: number;
  singleUseGranted: number;
  singleUseSpent: number;
}): SlotLedger {
  return {
    reusableSlots: state.reusableSlots,
    reusableUsed: state.outfits.filter((o) => o.slot === 'reusable').length,
    singleUseGranted: state.singleUseGranted,
    singleUseSpent: state.singleUseSpent,
  };
}

/**
 * Saved outfits, and the spaces they live in.
 *
 * Persisted locally so an outfit survives a restart — losing work you took time
 * to build is the fastest way to stop someone using an app. The server becomes
 * the source of truth once the API lands (T21/T23); this store is what the
 * screen reads either way.
 *
 * The *rule* about what a save costs lives in `@vastra/shared`, not here, and is
 * unit-tested there. This store only holds the numbers and applies it, so the
 * client's prediction of a charge and the server's enforcement of it can never
 * disagree.
 *
 * PROJECT.md §4: deleting an outfit is **always** permitted, immediately and
 * free. What the free tier limits is re-use of the space afterwards, which is an
 * ordinary consumable and leaves the right to erasure (UK GDPR Art. 17)
 * untouched. Deletion must never be gated, delayed, or priced.
 */
export const useSavedOutfits = create<SavedOutfitsState>()(
  persist(
    (set, get) => ({
      outfits: [],
      reusableSlots: BASE_REUSABLE_SLOTS,
      singleUseGranted: BASE_SINGLE_USE_CREDITS,
      singleUseSpent: 0,
      hydrated: false,

      save: (layers, name, isPro) => {
        if (countPieces(layers) < 2) return { ok: false, reason: 'too_few_pieces' };

        const applied = applySave(ledgerOf(get()), isPro);
        if (applied === null) return { ok: false, reason: 'no_space' };

        const outfit: SavedOutfit = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: name.trim() || 'Untitled outfit',
          // Copied, not referenced: the Studio keeps mutating after a save, and
          // a saved outfit must be the thing you decided on.
          layers: { ...layers },
          savedAt: new Date().toISOString(),
          slot: applied.slot,
        };

        // The credit is spent here, at the save — not held against the delete.
        // That ordering is the whole reason this is lawful: the cost attaches to
        // creating, never to removing.
        set((state) => ({
          outfits: [outfit, ...state.outfits],
          singleUseSpent: applied.ledger.singleUseSpent,
        }));

        return {
          ok: true,
          outfit,
          slot: applied.slot,
          creditsLeft: slotBalance(ledgerOf(get()), isPro).creditsLeft,
        };
      },

      /**
       * Unconditional. No entitlement check, no confirmation gate, no eligibility
       * test — see the §4 note above.
       *
       * `singleUseSpent` is deliberately *not* decremented: the credit stays
       * spent. That is what lets the outfit itself be removed completely rather
       * than retained purely to keep a counter honest.
       */
      remove: (id) =>
        set((state) => {
          const outfit = state.outfits.find((o) => o.id === id);
          if (!outfit) return state;
          const next = applyDelete(ledgerOf(state), outfit.slot);
          return {
            outfits: state.outfits.filter((o) => o.id !== id),
            singleUseSpent: next.singleUseSpent,
          };
        }),

      rename: (id, name) =>
        set((state) => ({
          outfits: state.outfits.map((o) =>
            o.id === id ? { ...o, name: name.trim() || o.name } : o,
          ),
        })),

      grantReusableSlots: (count) =>
        set((state) => ({ reusableSlots: state.reusableSlots + Math.max(0, count) })),

      grantSingleUseCredits: (count) =>
        set((state) => ({ singleUseGranted: state.singleUseGranted + Math.max(0, count) })),
    }),
    {
      name: 'vastra.outfits',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        outfits: state.outfits,
        reusableSlots: state.reusableSlots,
        singleUseGranted: state.singleUseGranted,
        singleUseSpent: state.singleUseSpent,
      }),
      /**
       * v0 had no slots — every outfit was interchangeable. Assign the oldest to
       * the permanent space and charge the rest against credits, so nobody loses
       * an outfit they already saved under the old rules.
       */
      migrate: (persisted, version) => {
        if (version >= 1) return persisted as Partial<SavedOutfitsState>;

        const old = (persisted ?? {}) as { outfits?: Omit<SavedOutfit, 'slot'>[] };
        const outfits = old.outfits ?? [];

        // Stored newest-first, so the oldest — the one kept longest — is last,
        // and is the one that earns the permanent space.
        const oldestFirst = [...outfits].reverse();
        const upgraded = oldestFirst.map((outfit, index) => ({
          ...outfit,
          slot: (index < BASE_REUSABLE_SLOTS ? 'reusable' : 'single_use') as SlotKind,
        }));

        return {
          outfits: upgraded.reverse(),
          reusableSlots: BASE_REUSABLE_SLOTS,
          singleUseGranted: BASE_SINGLE_USE_CREDITS,
          singleUseSpent: Math.max(0, upgraded.length - BASE_REUSABLE_SLOTS),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Spaces used and left, split by kind — the Outfits and Studio screens both
 *  need to show *which* kind is about to be spent, not just a total. */
export function useSpaces(isPro: boolean): SlotBalance & { used: number } {
  const outfits = useSavedOutfits((s) => s.outfits);
  const reusableSlots = useSavedOutfits((s) => s.reusableSlots);
  const singleUseGranted = useSavedOutfits((s) => s.singleUseGranted);
  const singleUseSpent = useSavedOutfits((s) => s.singleUseSpent);

  const balance = slotBalance(
    ledgerOf({ outfits, reusableSlots, singleUseGranted, singleUseSpent }),
    isPro,
  );

  return { ...balance, used: outfits.length };
}
