import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WishlistState {
  /** Item ids, newest first. */
  ids: string[];
  hydrated: boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Things you want but do not own.
 *
 * Deliberately separate from saved outfits, and deliberately **unlimited**. The
 * scarcity mechanic is outfit spaces, which is where the work and the value sit;
 * charging for a bookmark on something you are considering buying would be
 * taxing the user for intending to spend money, which is nonsense.
 */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      hydrated: false,
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((existing) => existing !== id)
            : [id, ...state.ids],
        })),
      remove: (id) => set((state) => ({ ids: state.ids.filter((existing) => existing !== id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'vastra.wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ ids: state.ids }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Whether one item is saved. A scalar selector, so a tile re-renders only when
 *  its own state changes rather than whenever anything is saved. */
export function useIsWishlisted(id: string): boolean {
  return useWishlist((s) => s.ids.includes(id));
}

/**
 * Wishlisted items, in the order they were saved.
 *
 * The selector returns the raw array and the mapping happens in `useMemo` — a
 * selector that builds a new array each call is compared by identity, looks like
 * a change every time, and re-renders forever. That exact bug has already been
 * fixed once in this codebase (`useVisiblePosts`).
 */
export function useWishlistItems<T extends { id: string }>(source: readonly T[]): T[] {
  const ids = useWishlist((s) => s.ids);
  return useMemo(() => {
    const byId = new Map(source.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter((item): item is T => item !== undefined);
  }, [ids, source]);
}
