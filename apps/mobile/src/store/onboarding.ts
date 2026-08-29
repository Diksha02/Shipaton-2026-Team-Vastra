import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingState {
  /** Null until storage has been read. Screens must not decide what to show
   *  before this resolves, or the walkthrough flashes on every launch. */
  seenWalkthrough: boolean | null;
  hydrated: boolean;
  complete: () => void;
  replay: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      seenWalkthrough: null,
      hydrated: false,
      complete: () => set({ seenWalkthrough: true }),
      replay: () => set({ seenWalkthrough: false }),
    }),
    {
      name: 'vastra.onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ seenWalkthrough: state.seenWalkthrough }),
      onRehydrateStorage: () => (state) => {
        // A first-ever launch has nothing stored, so seenWalkthrough stays null.
        // Treat that as "not seen" once hydration finishes.
        if (state) {
          state.hydrated = true;
          if (state.seenWalkthrough === null) state.seenWalkthrough = false;
        }
      },
    },
  ),
);

/** True only once storage has been read *and* the walkthrough is unseen.
 *  Never true during the hydration gap. */
export function useShouldShowWalkthrough(): boolean {
  return useOnboardingStore((s) => s.hydrated && s.seenWalkthrough === false);
}
