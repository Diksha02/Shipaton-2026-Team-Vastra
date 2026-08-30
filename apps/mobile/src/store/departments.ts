import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Department } from '@vastra/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DepartmentState {
  /** Empty means everything. See the note on `matchesDepartments`. */
  selected: Department[];
  hydrated: boolean;
  toggle: (department: Department) => void;
  clear: () => void;
}

/**
 * Which departments the shopper wants to see.
 *
 * Persisted, because "I shop menswear" is a stable fact about a person and
 * re-picking it every session is exactly the kind of repeated decision that
 * makes an app tiring. Preference onboarding (`/preferences`) sets this once
 * up front by writing into this store — filters remain the single source of
 * truth rather than a second preference model.
 *
 * Deliberately multi-select. Plenty of people shop across departments in a
 * single session — for themselves, a partner, and a child — and forcing one
 * choice would make the app wrong for them rather than merely unhelpful.
 */
export const useDepartments = create<DepartmentState>()(
  persist(
    (set) => ({
      selected: [],
      hydrated: false,
      toggle: (department) =>
        set((state) => ({
          selected: state.selected.includes(department)
            ? state.selected.filter((d) => d !== department)
            : [...state.selected, department],
        })),
      clear: () => set({ selected: [] }),
    }),
    {
      name: 'vastra.departments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selected: state.selected }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
