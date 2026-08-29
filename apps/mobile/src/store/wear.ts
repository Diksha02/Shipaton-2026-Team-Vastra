import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WearLog } from '@vastra/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WearState {
  log: Record<string, { wornAt: string[] }>;
  hydrated: boolean;
  /** Records today's wear for every item in an outfit, in one action. */
  markWorn: (itemIds: readonly string[], when?: Date) => void;
  undoLast: (itemIds: readonly string[]) => void;
  clear: () => void;
}

/** One entry per day per item. Wearing the same shirt twice in a day is not two
 *  data points, and letting it become two would quietly distort every "worn
 *  most" list in the app. */
function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

/**
 * What you actually wore.
 *
 * This is the smallest store in the app and the one the product rests on.
 * Without it Vastra can only list what you own — it can never tell you
 * anything you did not already know, and "wear more of what you have" stays a
 * slogan rather than a feature.
 *
 * Recording is one tap, from the Studio, for a whole outfit at once. Asking
 * someone to log garments individually is asking them to do data entry, and
 * nobody does data entry twice.
 */
export const useWear = create<WearState>()(
  persist(
    (set) => ({
      log: {},
      hydrated: false,

      markWorn: (itemIds, when = new Date()) =>
        set((state) => {
          const iso = when.toISOString();
          const log = { ...state.log };
          for (const id of itemIds) {
            const existing = log[id]?.wornAt ?? [];
            if (existing[0] && sameDay(existing[0], iso)) continue;
            log[id] = { wornAt: [iso, ...existing] };
          }
          return { log };
        }),

      undoLast: (itemIds) =>
        set((state) => {
          const log = { ...state.log };
          for (const id of itemIds) {
            const existing = log[id]?.wornAt ?? [];
            if (existing.length > 0) log[id] = { wornAt: existing.slice(1) };
          }
          return { log };
        }),

      clear: () => set({ log: {} }),
    }),
    {
      name: 'vastra.wear',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ log: state.log }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** The log, typed as the shared helpers expect it. */
export function useWearLog(): WearLog {
  return useWear((s) => s.log);
}
