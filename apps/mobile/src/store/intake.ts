import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemCategory, ItemColour } from '@vastra/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Draft {
  id: string;
  /** Local file URI from the picker. */
  uri: string;
  /** Null until the user says. Never guessed silently — a wrong auto-tag that
   *  looks confident is worse than an empty field. */
  category: ItemCategory | null;
  colour: ItemColour | null;
  title: string;
  capturedAt: string;
}

interface IntakeState {
  drafts: Draft[];
  hydrated: boolean;
  addMany: (uris: readonly string[]) => number;
  update: (id: string, patch: Partial<Omit<Draft, 'id' | 'uri'>>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Photographs waiting to become garments.
 *
 * This queue is the entire reason bulk capture works. Photographing and tagging
 * in one motion means every single garment costs a decision, and forty
 * decisions in a row is what makes people abandon a wardrobe app halfway
 * through their shirts. Separating the two lets someone empty a shelf in a
 * couple of minutes and label it later, on the sofa.
 *
 * Persisted deliberately: the queue must survive the app being closed, or a
 * half-finished intake is silently thrown away — which is worse than never
 * having offered bulk capture at all.
 */
export const useIntake = create<IntakeState>()(
  persist(
    (set, get) => ({
      drafts: [],
      hydrated: false,

      addMany: (uris) => {
        const existing = new Set(get().drafts.map((d) => d.uri));
        // The picker can hand back the same asset twice across sessions.
        const fresh = uris.filter((uri) => !existing.has(uri));
        if (fresh.length === 0) return 0;

        const now = new Date().toISOString();
        set((state) => ({
          drafts: [
            ...fresh.map((uri, index) => ({
              id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
              uri,
              category: null,
              colour: null,
              title: '',
              capturedAt: now,
            })),
            ...state.drafts,
          ],
        }));
        return fresh.length;
      },

      update: (id, patch) =>
        set((state) => ({
          drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      remove: (id) => set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) })),
      clear: () => set({ drafts: [] }),
    }),
    {
      name: 'vastra.intake',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ drafts: state.drafts }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** How many photos are waiting to be labelled. Drives the badge that stops an
 *  intake being forgotten. */
export function usePendingCount(): number {
  return useIntake((s) => s.drafts.length);
}
