import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX = 6;

interface RecentSearchState {
  queries: string[];
  remember: (query: string) => void;
  clear: () => void;
}

/**
 * Recent searches.
 *
 * Capped and de-duplicated case-insensitively, so searching "denim" twice does
 * not produce two entries and a long tail does not push the useful ones off
 * screen. Six is about what fits above the fold on the smallest phone we
 * support.
 */
export const useRecentSearches = create<RecentSearchState>()(
  persist(
    (set) => ({
      queries: [],
      remember: (query) => {
        const trimmed = query.trim();
        if (trimmed.length < 2) return;
        set((state) => ({
          queries: [
            trimmed,
            ...state.queries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
          ].slice(0, MAX),
        }));
      },
      clear: () => set({ queries: [] }),
    }),
    {
      name: 'vastra.recentSearches',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ queries: state.queries }),
    },
  ),
);
